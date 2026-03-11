from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from src.repositories.study_material_repository import StudyMaterialRepository
from src.schemas.study_material import (
    StudyMaterialCreate, StudyMaterialUpdate, StudyMaterialResponse,
    MaterialBookmarkCreate, MaterialBookmarkUpdate, MaterialBookmarkResponse,
    MaterialShareCreate, MaterialShareResponse, MaterialSearchFilters,
    MaterialStatsResponse, MaterialHierarchyNode, AutocompleteResponse,
    RecentlyAccessedResponse, MaterialTagCreate, MaterialTagResponse
)
from src.models.study_material import StudyMaterial, MaterialBookmark, MaterialShare
from src.models.user import User
from src.models.academic import Subject, Chapter, Topic, Grade


class StudyMaterialService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = StudyMaterialRepository(db)
    
    def create_material(
        self, material_data: StudyMaterialCreate, institution_id: int, user_id: int
    ) -> StudyMaterialResponse:
        material = self.repository.create_material(material_data, institution_id, user_id)
        return self._enrich_material_response(material, user_id)
    
    def get_material(
        self, material_id: int, institution_id: int, user_id: Optional[int] = None
    ) -> Optional[StudyMaterialResponse]:
        material = self.repository.get_material_by_id(material_id, institution_id, user_id)
        if not material:
            return None
        return self._enrich_material_response(material, user_id)
    
    def search_materials(
        self, filters: MaterialSearchFilters, institution_id: int, user_id: Optional[int] = None
    ) -> Tuple[List[StudyMaterialResponse], int]:
        materials, total = self.repository.get_materials(filters, institution_id, user_id)
        
        enriched_materials = [
            self._enrich_material_response(material, user_id) 
            for material in materials
        ]
        
        return enriched_materials, total
    
    def update_material(
        self, material_id: int, material_data: StudyMaterialUpdate, institution_id: int, user_id: int
    ) -> Optional[StudyMaterialResponse]:
        material = self.repository.update_material(material_id, material_data, institution_id)
        if not material:
            return None
        return self._enrich_material_response(material, user_id)
    
    def delete_material(self, material_id: int, institution_id: int) -> bool:
        return self.repository.delete_material(material_id, institution_id)
    
    def view_material(self, material_id: int, user_id: int, institution_id: int):
        self.repository.increment_view_count(material_id, user_id, institution_id)
    
    def download_material(self, material_id: int, user_id: int, institution_id: int):
        self.repository.increment_download_count(material_id, user_id, institution_id)
    
    def bookmark_material(
        self, bookmark_data: MaterialBookmarkCreate, user_id: int, institution_id: int
    ) -> MaterialBookmarkResponse:
        bookmark = self.repository.create_bookmark(bookmark_data, user_id, institution_id)
        return self._enrich_bookmark_response(bookmark)
    
    def update_bookmark(
        self, material_id: int, bookmark_data: MaterialBookmarkUpdate, user_id: int
    ) -> Optional[MaterialBookmarkResponse]:
        bookmark = self.repository.update_bookmark(material_id, bookmark_data, user_id)
        if not bookmark:
            return None
        return self._enrich_bookmark_response(bookmark)
    
    def remove_bookmark(self, material_id: int, user_id: int) -> bool:
        return self.repository.delete_bookmark(material_id, user_id)
    
    def get_user_bookmarks(
        self, user_id: int, institution_id: int, favorites_only: bool = False
    ) -> List[MaterialBookmarkResponse]:
        bookmarks = self.repository.get_user_bookmarks(user_id, institution_id, favorites_only)
        return [self._enrich_bookmark_response(bookmark) for bookmark in bookmarks]
    
    def share_material(
        self, share_data: MaterialShareCreate, user_id: int, institution_id: int
    ) -> MaterialShareResponse:
        share = self.repository.create_share(share_data, user_id, institution_id)
        return self._enrich_share_response(share)
    
    def get_shared_material(self, token: str) -> Optional[MaterialShareResponse]:
        share = self.repository.get_share_by_token(token)
        if not share:
            return None
        if share.expires_at and share.expires_at < datetime.utcnow():
            return None
        return self._enrich_share_response(share)
    
    def get_recently_accessed(
        self, user_id: int, institution_id: int, limit: int = 10
    ) -> List[StudyMaterialResponse]:
        materials = self.repository.get_recently_accessed(user_id, institution_id, limit)
        return [self._enrich_material_response(material, user_id) for material in materials]
    
    def get_material_hierarchy(
        self, institution_id: int, grade_id: Optional[int] = None
    ) -> List[MaterialHierarchyNode]:
        hierarchy = self.repository.get_material_hierarchy(institution_id, grade_id)
        return [MaterialHierarchyNode(**node) for node in hierarchy]
    
    def get_autocomplete(
        self, query: str, institution_id: int
    ) -> AutocompleteResponse:
        suggestions = self.repository.get_autocomplete_suggestions(query, institution_id)
        return AutocompleteResponse(**suggestions)
    
    def get_stats(
        self, institution_id: int, user_id: Optional[int] = None
    ) -> MaterialStatsResponse:
        stats = self.repository.get_material_stats(institution_id, user_id)
        
        stats['recent_uploads'] = [
            self._enrich_material_response(m, user_id) for m in stats['recent_uploads']
        ]
        stats['popular_materials'] = [
            self._enrich_material_response(m, user_id) for m in stats['popular_materials']
        ]
        
        return MaterialStatsResponse(**stats)
    
    def create_tag(
        self, tag_data: MaterialTagCreate, institution_id: int
    ) -> MaterialTagResponse:
        tag = self.repository.create_tag(tag_data, institution_id)
        return MaterialTagResponse.from_orm(tag)
    
    def get_tags(self, institution_id: int) -> List[MaterialTagResponse]:
        tags = self.repository.get_tags(institution_id)
        return [MaterialTagResponse.from_orm(tag) for tag in tags]
    
    def _enrich_material_response(
        self, material: StudyMaterial, user_id: Optional[int] = None
    ) -> StudyMaterialResponse:
        response_data = {
            **material.__dict__,
            'uploader_name': None,
            'subject_name': None,
            'chapter_name': None,
            'topic_name': None,
            'grade_name': None,
            'is_bookmarked': getattr(material, 'is_bookmarked', False),
            'is_favorite': getattr(material, 'is_favorite', False)
        }
        
        if material.uploader:
            response_data['uploader_name'] = material.uploader.full_name or material.uploader.email
        
        if material.subject:
            response_data['subject_name'] = material.subject.name
        
        if material.chapter:
            response_data['chapter_name'] = material.chapter.name
        
        if material.topic:
            response_data['topic_name'] = material.topic.name
        
        if material.grade:
            response_data['grade_name'] = material.grade.name
        
        return StudyMaterialResponse(**response_data)
    
    def _enrich_bookmark_response(self, bookmark: MaterialBookmark) -> MaterialBookmarkResponse:
        response_data = bookmark.__dict__.copy()
        
        if bookmark.material:
            response_data['material'] = self._enrich_material_response(
                bookmark.material, bookmark.user_id
            )
        
        return MaterialBookmarkResponse(**response_data)
    
    def _enrich_share_response(self, share: MaterialShare) -> MaterialShareResponse:
        response_data = share.__dict__.copy()
        
        if share.material:
            response_data['material'] = self._enrich_material_response(share.material)
        
        return MaterialShareResponse(**response_data)


from datetime import datetime
