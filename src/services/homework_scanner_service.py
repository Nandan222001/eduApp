from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import UploadFile
import re
import os
from io import BytesIO
from PIL import Image

from src.models.homework_scanner import HomeworkScan
from src.models.student import Student
from src.models.academic import Subject
from src.utils.s3_client import s3_client
from src.config import settings

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

try:
    import sympy as sp
    from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
    SYMPY_AVAILABLE = True
except ImportError:
    SYMPY_AVAILABLE = False

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class HomeworkScannerService:
    def __init__(self, db: Session):
        self.db = db
        self.openai_client = OpenAI(api_key=settings.openai_api_key) if OPENAI_AVAILABLE and settings.openai_api_key else None
    
    async def create_scan(
        self,
        institution_id: int,
        student_id: int,
        file: UploadFile,
        subject_id: Optional[int] = None,
        scan_title: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> HomeworkScan:
        file_content = await file.read()
        file_name = file.filename or "homework_scan.jpg"
        
        file_obj = BytesIO(file_content)
        file_url, s3_key = s3_client.upload_file(
            file_obj,
            file_name,
            folder=f"homework_scans/{institution_id}/{student_id}",
            content_type=file.content_type or "image/jpeg"
        )
        
        scan = HomeworkScan(
            institution_id=institution_id,
            student_id=student_id,
            subject_id=subject_id,
            scan_title=scan_title,
            image_url=file_url,
            s3_key=s3_key,
            processing_status="pending",
            metadata=metadata
        )
        
        self.db.add(scan)
        self.db.commit()
        self.db.refresh(scan)
        
        await self._process_scan(scan.id, file_content)
        
        return scan
    
    async def _process_scan(self, scan_id: int, image_content: bytes) -> None:
        scan = self.db.query(HomeworkScan).filter(HomeworkScan.id == scan_id).first()
        if not scan:
            return
        
        try:
            scan.processing_status = "processing"
            self.db.commit()
            
            extracted_text = await self._extract_text_from_image(image_content)
            scan.extracted_text = extracted_text
            
            detected_problems = await self._detect_problems(extracted_text)
            scan.detected_problems = detected_problems
            
            solutions = await self._generate_solutions(detected_problems)
            scan.solutions = solutions
            
            ai_feedback = await self._generate_ai_feedback(extracted_text, detected_problems, solutions)
            scan.ai_feedback = ai_feedback
            
            scan.confidence_score = Decimal("75.0")
            scan.processing_status = "completed"
            
        except Exception as e:
            scan.processing_status = "failed"
            scan.error_message = str(e)
        
        self.db.commit()
    
    async def _extract_text_from_image(self, image_content: bytes) -> str:
        if not TESSERACT_AVAILABLE:
            return "OCR not available. Please install pytesseract and Tesseract-OCR."
        
        try:
            image = Image.open(BytesIO(image_content))
            text = pytesseract.image_to_string(image)
            return text.strip()
        except Exception as e:
            return f"Error extracting text: {str(e)}"
    
    async def _detect_problems(self, text: str) -> List[Dict[str, Any]]:
        problems = []
        
        lines = text.split('\n')
        
        math_patterns = [
            (r'\d+\s*[\+\-\*\/\^]\s*\d+', 'arithmetic'),
            (r'x\s*[\+\-\*]\s*\d+\s*=\s*\d+', 'linear_equation'),
            (r'\d*x\^?\d*\s*[\+\-]\s*\d*x?\s*[\+\-]?\s*\d*\s*=\s*\d+', 'quadratic_equation'),
            (r'\d+\s*\/\s*\d+', 'fraction'),
            (r'\d+\s*\*\s*\d+', 'multiplication'),
        ]
        
        for idx, line in enumerate(lines):
            line = line.strip()
            if not line or len(line) < 3:
                continue
            
            problem_type = 'general'
            for pattern, ptype in math_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    problem_type = ptype
                    break
            
            if any(char in line for char in ['=', '+', '-', '*', '/', 'x', 'y']):
                problems.append({
                    "problem_text": line,
                    "problem_type": problem_type,
                    "line_number": idx + 1,
                    "difficulty": self._estimate_difficulty(line, problem_type)
                })
        
        return problems[:10]
    
    def _estimate_difficulty(self, text: str, problem_type: str) -> str:
        if problem_type == 'arithmetic':
            return 'easy'
        elif problem_type in ['linear_equation', 'fraction']:
            return 'medium'
        elif problem_type == 'quadratic_equation':
            return 'hard'
        return 'medium'
    
    async def _generate_solutions(self, problems: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        solutions = []
        
        for problem in problems:
            solution = await self._solve_problem(problem)
            solutions.append(solution)
        
        return solutions
    
    async def _solve_problem(self, problem: Dict[str, Any]) -> Dict[str, Any]:
        problem_text = problem.get('problem_text', '')
        problem_type = problem.get('problem_type', 'general')
        
        solution_data = {
            "problem_text": problem_text,
            "problem_type": problem_type,
            "solution": None,
            "steps": [],
            "explanation": ""
        }
        
        if not SYMPY_AVAILABLE:
            solution_data["explanation"] = "SymPy is not available for mathematical evaluation."
            return solution_data
        
        try:
            if problem_type == 'arithmetic':
                result = self._solve_arithmetic(problem_text)
                solution_data["solution"] = str(result)
                solution_data["steps"] = [f"Evaluate: {problem_text}", f"Result: {result}"]
            
            elif problem_type in ['linear_equation', 'quadratic_equation']:
                result = self._solve_equation(problem_text)
                solution_data["solution"] = str(result)
                solution_data["steps"] = [
                    f"Given equation: {problem_text}",
                    f"Solution: {result}"
                ]
            
            elif problem_type == 'fraction':
                result = self._solve_fraction(problem_text)
                solution_data["solution"] = str(result)
                solution_data["steps"] = [f"Simplify: {problem_text}", f"Result: {result}"]
            
            else:
                solution_data["explanation"] = "Problem type not supported for automatic solving."
        
        except Exception as e:
            solution_data["explanation"] = f"Could not solve automatically: {str(e)}"
        
        return solution_data
    
    def _solve_arithmetic(self, expression: str) -> Any:
        try:
            expression = expression.replace('×', '*').replace('÷', '/')
            expression = re.sub(r'[^\d\+\-\*\/\.\(\)]', '', expression)
            result = sp.sympify(expression)
            return float(result) if result.is_number else result
        except Exception:
            return "Error evaluating expression"
    
    def _solve_equation(self, equation: str) -> Any:
        try:
            equation = equation.replace('×', '*').replace('÷', '/')
            
            if '=' in equation:
                left, right = equation.split('=')
                eq = sp.Eq(parse_expr(left.strip()), parse_expr(right.strip()))
                solution = sp.solve(eq)
                return solution
            return "Not a valid equation"
        except Exception as e:
            return f"Error solving equation: {str(e)}"
    
    def _solve_fraction(self, fraction: str) -> Any:
        try:
            fraction = fraction.replace('÷', '/')
            result = sp.sympify(fraction)
            return sp.simplify(result)
        except Exception:
            return "Error simplifying fraction"
    
    async def _generate_ai_feedback(
        self,
        text: str,
        problems: List[Dict[str, Any]],
        solutions: List[Dict[str, Any]]
    ) -> str:
        if not self.openai_client:
            return "AI feedback is not available. OpenAI API key not configured."
        
        try:
            prompt = f"""Analyze this student's homework and provide helpful feedback:

Extracted Text:
{text[:500]}

Detected Problems: {len(problems)}
Problem Types: {', '.join(set(p.get('problem_type', 'unknown') for p in problems))}

Provide:
1. Overall assessment of the homework
2. Suggestions for improvement
3. Tips for solving similar problems
4. Encouragement

Keep it concise and student-friendly."""
            
            response = self.openai_client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": "You are a helpful tutor providing feedback on student homework."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            return response.choices[0].message.content
        except Exception as e:
            return f"Could not generate AI feedback: {str(e)}"
    
    def get_scan(self, scan_id: int) -> Optional[HomeworkScan]:
        return self.db.query(HomeworkScan).filter(HomeworkScan.id == scan_id).first()
    
    def get_student_scans(
        self,
        student_id: int,
        subject_id: Optional[int] = None,
        limit: int = 20,
        skip: int = 0
    ) -> List[HomeworkScan]:
        query = self.db.query(HomeworkScan).filter(
            HomeworkScan.student_id == student_id
        )
        
        if subject_id:
            query = query.filter(HomeworkScan.subject_id == subject_id)
        
        return query.order_by(HomeworkScan.created_at.desc()).offset(skip).limit(limit).all()
    
    def analyze_scan(self, scan_id: int) -> Dict[str, Any]:
        scan = self.get_scan(scan_id)
        if not scan:
            return {"error": "Scan not found"}
        
        problems = scan.detected_problems or []
        solutions = scan.solutions or []
        
        detected_problems = []
        for i, problem in enumerate(problems):
            solution_data = solutions[i] if i < len(solutions) else {}
            detected_problems.append({
                "problem_text": problem.get('problem_text', ''),
                "problem_type": problem.get('problem_type', 'unknown'),
                "difficulty": problem.get('difficulty', 'medium'),
                "solution": solution_data.get('solution'),
                "steps": solution_data.get('steps', []),
                "confidence": 0.75
            })
        
        difficulty_counts = {}
        for p in problems:
            diff = p.get('difficulty', 'medium')
            difficulty_counts[diff] = difficulty_counts.get(diff, 0) + 1
        
        overall_difficulty = 'medium'
        if difficulty_counts.get('hard', 0) > len(problems) // 2:
            overall_difficulty = 'hard'
        elif difficulty_counts.get('easy', 0) > len(problems) // 2:
            overall_difficulty = 'easy'
        
        estimated_time = len(problems) * 5
        
        recommendations = [
            "Review the step-by-step solutions provided",
            "Practice similar problems to reinforce understanding",
            "If stuck, break down the problem into smaller parts"
        ]
        
        if overall_difficulty == 'hard':
            recommendations.append("Consider seeking additional help for challenging topics")
        
        return {
            "scan_id": scan.id,
            "problems_count": len(detected_problems),
            "problems": detected_problems,
            "overall_difficulty": overall_difficulty,
            "estimated_time_minutes": estimated_time,
            "recommendations": recommendations,
            "ai_feedback": scan.ai_feedback or "Processing feedback..."
        }
    
    def delete_scan(self, scan_id: int) -> bool:
        scan = self.get_scan(scan_id)
        if not scan:
            return False
        
        self.db.delete(scan)
        self.db.commit()
        return True
