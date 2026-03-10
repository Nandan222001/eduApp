from typing import Optional, List, Tuple, BinaryIO
from sqlalchemy.orm import Session
from src.repositories.previous_year_papers_repository import (
    PreviousYearPaperRepository,
    QuestionBankRepository
)
from src.schemas.previous_year_papers import (
    PreviousYearPaperCreate,
    PreviousYearPaperUpdate,
    PreviousYearPaperResponse,
    QuestionBankCreate,
    QuestionBankUpdate,
    QuestionBankResponse,
    PaperStatistics,
    QuestionStatistics,
    FacetCounts
)
from src.models.previous_year_papers import (
    QuestionType,
    DifficultyLevel,
    BloomTaxonomyLevel,
    Board
)
from src.utils.s3_client import s3_client


class PreviousYearPaperService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = PreviousYearPaperRepository(db)

    def create_paper(self, paper_data: PreviousYearPaperCreate) -> PreviousYearPaperResponse:
        paper = self.repository.create(paper_data)
        return PreviousYearPaperResponse.model_validate(paper)

    def get_paper(self, paper_id: int) -> Optional[PreviousYearPaperResponse]:
        paper = self.repository.get_by_id(paper_id)
        if not paper:
            return None
        return PreviousYearPaperResponse.model_validate(paper)

    def update_paper(
        self,
        paper_id: int,
        paper_data: PreviousYearPaperUpdate
    ) -> Optional[PreviousYearPaperResponse]:
        paper = self.repository.update(paper_id, paper_data)
        if not paper:
            return None
        return PreviousYearPaperResponse.model_validate(paper)

    def delete_paper(self, paper_id: int) -> bool:
        paper = self.repository.get_by_id(paper_id)
        if not paper:
            return False
        
        if paper.pdf_s3_key:
            try:
                s3_client.delete_file(paper.pdf_s3_key)
            except Exception:
                pass
        
        return self.repository.delete(paper_id)

    def list_papers(
        self,
        institution_id: int,
        skip: int = 0,
        limit: int = 100,
        board: Optional[Board] = None,
        year: Optional[int] = None,
        grade_id: Optional[int] = None,
        subject_id: Optional[int] = None,
        is_active: Optional[bool] = None,
        ocr_processed: Optional[bool] = None,
        search: Optional[str] = None
    ) -> Tuple[List[PreviousYearPaperResponse], int]:
        papers, total = self.repository.list_papers(
            institution_id=institution_id,
            skip=skip,
            limit=limit,
            board=board,
            year=year,
            grade_id=grade_id,
            subject_id=subject_id,
            is_active=is_active,
            ocr_processed=ocr_processed,
            search=search
        )
        
        return [PreviousYearPaperResponse.model_validate(p) for p in papers], total

    def upload_pdf(
        self,
        paper_id: int,
        file: BinaryIO,
        file_name: str,
        file_size: int,
        content_type: str
    ) -> Optional[PreviousYearPaperResponse]:
        paper = self.repository.get_by_id(paper_id)
        if not paper:
            return None
        
        if paper.pdf_s3_key:
            try:
                s3_client.delete_file(paper.pdf_s3_key)
            except Exception:
                pass
        
        file_url, s3_key = s3_client.upload_file(
            file_obj=file,
            file_name=file_name,
            folder="previous_year_papers",
            content_type=content_type
        )
        
        updated_paper = self.repository.update_pdf_info(
            paper_id=paper_id,
            file_name=file_name,
            file_size=file_size,
            file_url=file_url,
            s3_key=s3_key
        )
        
        if not updated_paper:
            return None
        
        return PreviousYearPaperResponse.model_validate(updated_paper)

    def update_ocr_text(self, paper_id: int, ocr_text: str) -> Optional[PreviousYearPaperResponse]:
        paper = self.repository.update_ocr_text(paper_id, ocr_text)
        if not paper:
            return None
        return PreviousYearPaperResponse.model_validate(paper)

    def increment_view_count(self, paper_id: int) -> bool:
        return self.repository.increment_view_count(paper_id)

    def increment_download_count(self, paper_id: int) -> bool:
        return self.repository.increment_download_count(paper_id)

    def get_statistics(self, institution_id: int) -> PaperStatistics:
        stats = self.repository.get_statistics(institution_id)
        
        papers_by_board = {k.value if hasattr(k, 'value') else k: v for k, v in stats.get('papers_by_board', {}).items()}
        
        return PaperStatistics(
            total_papers=stats.get('total_papers', 0),
            papers_by_board=papers_by_board,
            papers_by_year=stats.get('papers_by_year', {}),
            papers_by_grade=stats.get('papers_by_grade', {}),
            papers_by_subject=stats.get('papers_by_subject', {}),
            ocr_processed_count=stats.get('ocr_processed_count', 0),
            ocr_pending_count=stats.get('ocr_pending_count', 0)
        )

    def get_facets(self, institution_id: int) -> dict:
        facets = self.repository.get_facets(institution_id)
        
        boards_dict = {k.value if hasattr(k, 'value') else k: v for k, v in facets.get('boards', {}).items()}
        
        return {
            "boards": boards_dict,
            "years": facets.get('years', [])
        }


class QuestionBankService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = QuestionBankRepository(db)

    def create_question(self, question_data: QuestionBankCreate) -> QuestionBankResponse:
        question = self.repository.create(question_data)
        return QuestionBankResponse.model_validate(question)

    def get_question(self, question_id: int) -> Optional[QuestionBankResponse]:
        question = self.repository.get_by_id(question_id)
        if not question:
            return None
        return QuestionBankResponse.model_validate(question)

    def update_question(
        self,
        question_id: int,
        question_data: QuestionBankUpdate
    ) -> Optional[QuestionBankResponse]:
        question = self.repository.update(question_id, question_data)
        if not question:
            return None
        return QuestionBankResponse.model_validate(question)

    def delete_question(self, question_id: int) -> bool:
        question = self.repository.get_by_id(question_id)
        if not question:
            return False
        
        if question.image_s3_key:
            try:
                s3_client.delete_file(question.image_s3_key)
            except Exception:
                pass
        
        return self.repository.delete(question_id)

    def list_questions(
        self,
        institution_id: int,
        skip: int = 0,
        limit: int = 100,
        paper_id: Optional[int] = None,
        grade_id: Optional[int] = None,
        subject_id: Optional[int] = None,
        chapter_id: Optional[int] = None,
        topic_id: Optional[int] = None,
        question_type: Optional[QuestionType] = None,
        difficulty_level: Optional[DifficultyLevel] = None,
        bloom_taxonomy_level: Optional[BloomTaxonomyLevel] = None,
        is_active: Optional[bool] = None,
        is_verified: Optional[bool] = None,
        search: Optional[str] = None
    ) -> Tuple[List[QuestionBankResponse], int]:
        questions, total = self.repository.list_questions(
            institution_id=institution_id,
            skip=skip,
            limit=limit,
            paper_id=paper_id,
            grade_id=grade_id,
            subject_id=subject_id,
            chapter_id=chapter_id,
            topic_id=topic_id,
            question_type=question_type,
            difficulty_level=difficulty_level,
            bloom_taxonomy_level=bloom_taxonomy_level,
            is_active=is_active,
            is_verified=is_verified,
            search=search
        )
        
        return [QuestionBankResponse.model_validate(q) for q in questions], total

    def verify_question(
        self,
        question_id: int,
        is_verified: bool,
        verified_by: int
    ) -> Optional[QuestionBankResponse]:
        question = self.repository.verify_question(question_id, is_verified, verified_by)
        if not question:
            return None
        return QuestionBankResponse.model_validate(question)

    def increment_usage_count(self, question_id: int) -> bool:
        return self.repository.increment_usage_count(question_id)

    def upload_image(
        self,
        question_id: int,
        file: BinaryIO,
        file_name: str,
        content_type: str
    ) -> Optional[QuestionBankResponse]:
        question = self.repository.get_by_id(question_id)
        if not question:
            return None
        
        if question.image_s3_key:
            try:
                s3_client.delete_file(question.image_s3_key)
            except Exception:
                pass
        
        file_url, s3_key = s3_client.upload_file(
            file_obj=file,
            file_name=file_name,
            folder="question_images",
            content_type=content_type
        )
        
        updated_question = self.repository.update_image(
            question_id=question_id,
            image_url=file_url,
            image_s3_key=s3_key
        )
        
        if not updated_question:
            return None
        
        return QuestionBankResponse.model_validate(updated_question)

    def get_statistics(self, institution_id: int) -> QuestionStatistics:
        stats = self.repository.get_statistics(institution_id)
        
        questions_by_type = {k.value if hasattr(k, 'value') else k: v for k, v in stats.get('questions_by_type', {}).items()}
        questions_by_difficulty = {k.value if hasattr(k, 'value') else k: v for k, v in stats.get('questions_by_difficulty', {}).items()}
        questions_by_bloom_level = {k.value if hasattr(k, 'value') else k: v for k, v in stats.get('questions_by_bloom_level', {}).items()}
        
        return QuestionStatistics(
            total_questions=stats.get('total_questions', 0),
            questions_by_type=questions_by_type,
            questions_by_difficulty=questions_by_difficulty,
            questions_by_bloom_level=questions_by_bloom_level,
            verified_count=stats.get('verified_count', 0),
            unverified_count=stats.get('unverified_count', 0),
            questions_by_chapter=stats.get('questions_by_chapter', {})
        )

    def get_facets(self, institution_id: int) -> dict:
        facets = self.repository.get_facets(institution_id)
        
        question_types = {k.value if hasattr(k, 'value') else k: v for k, v in facets.get('question_types', {}).items()}
        difficulty_levels = {k.value if hasattr(k, 'value') else k: v for k, v in facets.get('difficulty_levels', {}).items()}
        bloom_levels = {k.value if hasattr(k, 'value') else k: v for k, v in facets.get('bloom_levels', {}).items()}
        
        return {
            "question_types": question_types,
            "difficulty_levels": difficulty_levels,
            "bloom_levels": bloom_levels
        }

    def get_questions_by_paper(
        self,
        paper_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[QuestionBankResponse], int]:
        questions, total = self.repository.get_by_paper(paper_id, skip, limit)
        return [QuestionBankResponse.model_validate(q) for q in questions], total
