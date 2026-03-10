from typing import Optional, Dict, Any
import io
from PIL import Image
import PyPDF2


class OCRService:
    @staticmethod
    def extract_text_from_pdf(pdf_bytes: bytes) -> Optional[str]:
        try:
            pdf_file = io.BytesIO(pdf_bytes)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text_content = []
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                if text:
                    text_content.append(f"--- Page {page_num + 1} ---\n{text}")
            
            return "\n\n".join(text_content) if text_content else None
        except Exception as e:
            return None

    @staticmethod
    def prepare_for_ocr(pdf_bytes: bytes) -> Dict[str, Any]:
        try:
            pdf_file = io.BytesIO(pdf_bytes)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            metadata = {
                "num_pages": len(pdf_reader.pages),
                "has_extractable_text": False,
                "pages_info": []
            }
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                
                page_info = {
                    "page_number": page_num + 1,
                    "has_text": bool(text and text.strip()),
                    "text_length": len(text) if text else 0
                }
                
                if page_info["has_text"]:
                    metadata["has_extractable_text"] = True
                
                metadata["pages_info"].append(page_info)
            
            return metadata
        except Exception as e:
            return {
                "error": str(e),
                "num_pages": 0,
                "has_extractable_text": False,
                "pages_info": []
            }

    @staticmethod
    def validate_ocr_quality(ocr_text: str) -> Dict[str, Any]:
        if not ocr_text or not ocr_text.strip():
            return {
                "is_valid": False,
                "quality_score": 0,
                "issues": ["Empty or no text extracted"]
            }
        
        issues = []
        word_count = len(ocr_text.split())
        line_count = len(ocr_text.split('\n'))
        char_count = len(ocr_text)
        
        quality_score = 100
        
        if word_count < 10:
            issues.append("Very few words extracted")
            quality_score -= 30
        
        if char_count > 0:
            special_char_ratio = sum(1 for c in ocr_text if not c.isalnum() and not c.isspace()) / char_count
            if special_char_ratio > 0.3:
                issues.append("High ratio of special characters")
                quality_score -= 20
        
        avg_word_length = char_count / word_count if word_count > 0 else 0
        if avg_word_length < 2 or avg_word_length > 15:
            issues.append("Unusual average word length")
            quality_score -= 15
        
        return {
            "is_valid": quality_score >= 50,
            "quality_score": max(0, quality_score),
            "word_count": word_count,
            "line_count": line_count,
            "char_count": char_count,
            "issues": issues if issues else ["No major issues detected"]
        }

    @staticmethod
    def extract_questions_from_text(ocr_text: str) -> list:
        if not ocr_text:
            return []
        
        question_patterns = [
            r'Q\.\s*\d+',
            r'Question\s+\d+',
            r'\d+\.\s+',
            r'\(\d+\)',
        ]
        
        questions = []
        lines = ocr_text.split('\n')
        current_question = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            is_question_start = any(
                line.startswith(f"{i}.") or 
                line.startswith(f"Q.{i}") or 
                line.startswith(f"Question {i}")
                for i in range(1, 101)
            )
            
            if is_question_start and current_question:
                questions.append('\n'.join(current_question))
                current_question = [line]
            else:
                current_question.append(line)
        
        if current_question:
            questions.append('\n'.join(current_question))
        
        return questions

    @staticmethod
    def tag_chapters_in_text(ocr_text: str, chapters: list) -> Dict[str, list]:
        chapter_tags = {}
        
        if not ocr_text or not chapters:
            return chapter_tags
        
        ocr_lower = ocr_text.lower()
        
        for chapter in chapters:
            chapter_name = chapter.get('name', '').lower()
            chapter_code = chapter.get('code', '').lower()
            
            if chapter_name and (chapter_name in ocr_lower or 
                                (chapter_code and chapter_code in ocr_lower)):
                chapter_tags[chapter.get('id')] = {
                    'chapter_id': chapter.get('id'),
                    'chapter_name': chapter.get('name'),
                    'mentions': ocr_lower.count(chapter_name) if chapter_name else 0
                }
        
        return chapter_tags


ocr_service = OCRService()
