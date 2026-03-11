from typing import List, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy import and_, or_, func, desc, asc
from sqlalchemy.orm import Session, joinedload
from src.models.study_material import (
    StudyMaterial, MaterialBookmark, MaterialAccessLog, MaterialShare, MaterialTag, MaterialType
)
from src.models.user import User
from src.models.academic import Subject, Chapter, Topic, Grade
from src.schemas.study_material import (
    StudyMaterialCreate, StudyMaterialUpdate, MaterialBookmarkCreate, 
    MaterialBookmarkUpdate, MaterialShareCreate, MaterialSearchFilters,
    MaterialTagCreate, MaterialTagUpdate
)


class StudyMaterialRepository:
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_material(
        self, material_data: StudyMaterialCreate, institution_id: int, user_id: int
    ) -> StudyMaterial:
        material = StudyMaterial(
            **material_data.model_dump(),
            institution_id=institution_id,
            uploaded_by=user_id
        )
        self.db.add(material)
        self.db.commit()
        self.db.refresh(material)
        
        if material_data.tags:
            self._update_tag_usage(material_data.tags, institution_id)
        
        return material
    
    def get_material_by_id(
        self, material_id: int, institution_id: int, user_id: Optional[int] = None
    ) -> Optional[StudyMaterial]:
        query = self.db.query(StudyMaterial).filter(
            StudyMaterial.id == material_id,
            StudyMaterial.institution_id == institution_id,
            StudyMaterial.is_active == True
        )
        
        material = query.first()
        
        if material and user_id:
            material.is_bookmarked = self.is_bookmarked(material_id, user_id)
            bookmark = self.get_bookmark(material_id, user_id)
            material.is_favorite = bookmark.is_favorite if bookmark else False
        
        return material
    
    def get_materials(
        self, filters: MaterialSearchFilters, institution_id: int, user_id: Optional[int] = None
    ) -> Tuple[List[StudyMaterial], int]:
        query = self.db.query(StudyMaterial).filter(
            StudyMaterial.institution_id == institution_id,
            StudyMaterial.is_active == True
        )
        
        if filters.query:
            search_term = f"%{filters.query}%"
            query = query.filter(
                or_(
                    StudyMaterial.title.ilike(search_term),
                    StudyMaterial.description.ilike(search_term),
                    StudyMaterial.file_name.ilike(search_term)
                )
            )
        
        if filters.material_type:
            query = query.filter(StudyMaterial.material_type == filters.material_type)
        
        if filters.subject_id:
            query = query.filter(StudyMaterial.subject_id == filters.subject_id)
        
        if filters.chapter_id:
            query = query.filter(StudyMaterial.chapter_id == filters.chapter_id)
        
        if filters.topic_id:
            query = query.filter(StudyMaterial.topic_id == filters.topic_id)
        
        if filters.grade_id:
            query = query.filter(StudyMaterial.grade_id == filters.grade_id)
        
        if filters.uploaded_by:
            query = query.filter(StudyMaterial.uploaded_by == filters.uploaded_by)
        
        if filters.is_public is not None:
            query = query.filter(StudyMaterial.is_public == filters.is_public)
        
        if filters.tags:
            query = query.filter(StudyMaterial.tags.overlap(filters.tags))
        
        if filters.date_from:
            query = query.filter(StudyMaterial.created_at >= filters.date_from)
        
        if filters.date_to:
            query = query.filter(StudyMaterial.created_at <= filters.date_to)
        
        total = query.count()
        
        if filters.sort_by == "title":
            order_col = StudyMaterial.title
        elif filters.sort_by == "view_count":
            order_col = StudyMaterial.view_count
        elif filters.sort_by == "download_count":
            order_col = StudyMaterial.download_count
        elif filters.sort_by == "updated_at":
            order_col = StudyMaterial.updated_at
        else:
            order_col = StudyMaterial.created_at
        
        if filters.sort_order == "asc":
            query = query.order_by(asc(order_col))
        else:
            query = query.order_by(desc(order_col))
        
        offset = (filters.page - 1) * filters.page_size
        materials = query.offset(offset).limit(filters.page_size).all()
        
        if user_id:
            for material in materials:
                material.is_bookmarked = self.is_bookmarked(material.id, user_id)
                bookmark = self.get_bookmark(material.id, user_id)
                material.is_favorite = bookmark.is_favorite if bookmark else False
        
        return materials, total
    
    def update_material(
        self, material_id: int, material_data: StudyMaterialUpdate, institution_id: int
    ) -> Optional[StudyMaterial]:
        material = self.db.query(StudyMaterial).filter(
            StudyMaterial.id == material_id,
            StudyMaterial.institution_id == institution_id
        ).first()
        
        if not material:
            return None
        
        update_data = material_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(material, key, value)
        
        if material_data.tags is not None:
            self._update_tag_usage(material_data.tags, institution_id)
        
        self.db.commit()
        self.db.refresh(material)
        return material
    
    def delete_material(self, material_id: int, institution_id: int) -> bool:
        material = self.db.query(StudyMaterial).filter(
            StudyMaterial.id == material_id,
            StudyMaterial.institution_id == institution_id
        ).first()
        
        if not material:
            return False
        
        material.is_active = False
        self.db.commit()
        return True
    
    def increment_view_count(self, material_id: int, user_id: int, institution_id: int):
        material = self.db.query(StudyMaterial).filter(
            StudyMaterial.id == material_id,
            StudyMaterial.institution_id == institution_id
        ).first()
        
        if material:
            material.view_count += 1
            self.db.commit()
            
            log = MaterialAccessLog(
                institution_id=institution_id,
                material_id=material_id,
                user_id=user_id,
                action="view"
            )
            self.db.add(log)
            self.db.commit()
    
    def increment_download_count(self, material_id: int, user_id: int, institution_id: int):
        material = self.db.query(StudyMaterial).filter(
            StudyMaterial.id == material_id,
            StudyMaterial.institution_id == institution_id
        ).first()
        
        if material:
            material.download_count += 1
            self.db.commit()
            
            log = MaterialAccessLog(
                institution_id=institution_id,
                material_id=material_id,
                user_id=user_id,
                action="download"
            )
            self.db.add(log)
            self.db.commit()
    
    def create_bookmark(
        self, bookmark_data: MaterialBookmarkCreate, user_id: int, institution_id: int
    ) -> MaterialBookmark:
        existing = self.db.query(MaterialBookmark).filter(
            MaterialBookmark.material_id == bookmark_data.material_id,
            MaterialBookmark.user_id == user_id
        ).first()
        
        if existing:
            existing.notes = bookmark_data.notes
            existing.is_favorite = bookmark_data.is_favorite
            self.db.commit()
            self.db.refresh(existing)
            return existing
        
        bookmark = MaterialBookmark(
            **bookmark_data.model_dump(),
            user_id=user_id,
            institution_id=institution_id
        )
        self.db.add(bookmark)
        self.db.commit()
        self.db.refresh(bookmark)
        return bookmark
    
    def update_bookmark(
        self, material_id: int, bookmark_data: MaterialBookmarkUpdate, user_id: int
    ) -> Optional[MaterialBookmark]:
        bookmark = self.db.query(MaterialBookmark).filter(
            MaterialBookmark.material_id == material_id,
            MaterialBookmark.user_id == user_id
        ).first()
        
        if not bookmark:
            return None
        
        update_data = bookmark_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(bookmark, key, value)
        
        self.db.commit()
        self.db.refresh(bookmark)
        return bookmark
    
    def delete_bookmark(self, material_id: int, user_id: int) -> bool:
        bookmark = self.db.query(MaterialBookmark).filter(
            MaterialBookmark.material_id == material_id,
            MaterialBookmark.user_id == user_id
        ).first()
        
        if not bookmark:
            return False
        
        self.db.delete(bookmark)
        self.db.commit()
        return True
    
    def get_bookmark(self, material_id: int, user_id: int) -> Optional[MaterialBookmark]:
        return self.db.query(MaterialBookmark).filter(
            MaterialBookmark.material_id == material_id,
            MaterialBookmark.user_id == user_id
        ).first()
    
    def is_bookmarked(self, material_id: int, user_id: int) -> bool:
        return self.db.query(MaterialBookmark).filter(
            MaterialBookmark.material_id == material_id,
            MaterialBookmark.user_id == user_id
        ).count() > 0
    
    def get_user_bookmarks(
        self, user_id: int, institution_id: int, favorites_only: bool = False
    ) -> List[MaterialBookmark]:
        query = self.db.query(MaterialBookmark).filter(
            MaterialBookmark.user_id == user_id,
            MaterialBookmark.institution_id == institution_id
        ).join(StudyMaterial).filter(StudyMaterial.is_active == True)
        
        if favorites_only:
            query = query.filter(MaterialBookmark.is_favorite == True)
        
        return query.order_by(desc(MaterialBookmark.updated_at)).all()
    
    def create_share(
        self, share_data: MaterialShareCreate, user_id: int, institution_id: int
    ) -> MaterialShare:
        import secrets
        
        share = MaterialShare(
            **share_data.model_dump(),
            shared_by=user_id,
            institution_id=institution_id,
            share_token=secrets.token_urlsafe(32)
        )
        self.db.add(share)
        self.db.commit()
        self.db.refresh(share)
        
        log = MaterialAccessLog(
            institution_id=institution_id,
            material_id=share_data.material_id,
            user_id=user_id,
            action="share"
        )
        self.db.add(log)
        self.db.commit()
        
        return share
    
    def get_share_by_token(self, token: str) -> Optional[MaterialShare]:
        return self.db.query(MaterialShare).filter(
            MaterialShare.share_token == token,
            MaterialShare.is_active == True
        ).first()
    
    def get_recently_accessed(
        self, user_id: int, institution_id: int, limit: int = 10
    ) -> List[StudyMaterial]:
        recent_ids = self.db.query(MaterialAccessLog.material_id).filter(
            MaterialAccessLog.user_id == user_id,
            MaterialAccessLog.institution_id == institution_id,
            MaterialAccessLog.action == "view"
        ).order_by(desc(MaterialAccessLog.accessed_at)).distinct().limit(limit).all()
        
        material_ids = [r[0] for r in recent_ids]
        
        if not material_ids:
            return []
        
        materials = self.db.query(StudyMaterial).filter(
            StudyMaterial.id.in_(material_ids),
            StudyMaterial.is_active == True
        ).all()
        
        material_dict = {m.id: m for m in materials}
        ordered_materials = [material_dict[mid] for mid in material_ids if mid in material_dict]
        
        for material in ordered_materials:
            material.is_bookmarked = self.is_bookmarked(material.id, user_id)
            bookmark = self.get_bookmark(material.id, user_id)
            material.is_favorite = bookmark.is_favorite if bookmark else False
        
        return ordered_materials
    
    def get_material_hierarchy(self, institution_id: int, grade_id: Optional[int] = None):
        query = self.db.query(
            Subject.id.label('subject_id'),
            Subject.name.label('subject_name'),
            Chapter.id.label('chapter_id'),
            Chapter.name.label('chapter_name'),
            Topic.id.label('topic_id'),
            Topic.name.label('topic_name'),
            func.count(StudyMaterial.id).label('material_count')
        ).select_from(Subject).outerjoin(
            Chapter, Chapter.subject_id == Subject.id
        ).outerjoin(
            Topic, Topic.chapter_id == Chapter.id
        ).outerjoin(
            StudyMaterial,
            and_(
                or_(
                    StudyMaterial.subject_id == Subject.id,
                    StudyMaterial.chapter_id == Chapter.id,
                    StudyMaterial.topic_id == Topic.id
                ),
                StudyMaterial.is_active == True
            )
        ).filter(
            Subject.institution_id == institution_id,
            Subject.is_active == True
        )
        
        if grade_id:
            query = query.filter(
                or_(
                    StudyMaterial.grade_id == grade_id,
                    StudyMaterial.grade_id.is_(None)
                )
            )
        
        query = query.group_by(
            Subject.id, Subject.name,
            Chapter.id, Chapter.name,
            Topic.id, Topic.name
        )
        
        results = query.all()
        
        hierarchy = {}
        for row in results:
            if row.subject_id not in hierarchy:
                hierarchy[row.subject_id] = {
                    'id': row.subject_id,
                    'name': row.subject_name,
                    'type': 'subject',
                    'material_count': 0,
                    'children': {}
                }
            
            if row.chapter_id:
                if row.chapter_id not in hierarchy[row.subject_id]['children']:
                    hierarchy[row.subject_id]['children'][row.chapter_id] = {
                        'id': row.chapter_id,
                        'name': row.chapter_name,
                        'type': 'chapter',
                        'material_count': 0,
                        'children': {}
                    }
                
                if row.topic_id:
                    hierarchy[row.subject_id]['children'][row.chapter_id]['children'][row.topic_id] = {
                        'id': row.topic_id,
                        'name': row.topic_name,
                        'type': 'topic',
                        'material_count': row.material_count,
                        'children': []
                    }
                    hierarchy[row.subject_id]['children'][row.chapter_id]['material_count'] += row.material_count
                else:
                    hierarchy[row.subject_id]['children'][row.chapter_id]['material_count'] += row.material_count
                
                hierarchy[row.subject_id]['material_count'] += row.material_count
            else:
                hierarchy[row.subject_id]['material_count'] += row.material_count
        
        for subject in hierarchy.values():
            subject['children'] = [
                {**chapter, 'children': list(chapter['children'].values())}
                for chapter in subject['children'].values()
            ]
        
        return list(hierarchy.values())
    
    def get_autocomplete_suggestions(
        self, query: str, institution_id: int
    ) -> dict:
        search_term = f"%{query}%"
        
        titles = self.db.query(StudyMaterial.title).filter(
            StudyMaterial.institution_id == institution_id,
            StudyMaterial.is_active == True,
            StudyMaterial.title.ilike(search_term)
        ).limit(5).all()
        
        tags_query = self.db.query(
            func.unnest(StudyMaterial.tags).label('tag')
        ).filter(
            StudyMaterial.institution_id == institution_id,
            StudyMaterial.is_active == True
        ).distinct().subquery()
        
        tags = self.db.query(tags_query.c.tag).filter(
            tags_query.c.tag.ilike(search_term)
        ).limit(5).all()
        
        subjects = self.db.query(
            Subject.id, Subject.name
        ).filter(
            Subject.institution_id == institution_id,
            Subject.is_active == True,
            Subject.name.ilike(search_term)
        ).limit(5).all()
        
        return {
            'suggestions': [t[0] for t in titles],
            'tags': [t[0] for t in tags if t[0]],
            'subjects': [{'id': s.id, 'name': s.name} for s in subjects]
        }
    
    def get_material_stats(
        self, institution_id: int, user_id: Optional[int] = None
    ) -> dict:
        total_materials = self.db.query(func.count(StudyMaterial.id)).filter(
            StudyMaterial.institution_id == institution_id,
            StudyMaterial.is_active == True
        ).scalar()
        
        stats = self.db.query(
            func.sum(StudyMaterial.view_count).label('total_views'),
            func.sum(StudyMaterial.download_count).label('total_downloads')
        ).filter(
            StudyMaterial.institution_id == institution_id,
            StudyMaterial.is_active == True
        ).first()
        
        by_type = self.db.query(
            StudyMaterial.material_type,
            func.count(StudyMaterial.id).label('count')
        ).filter(
            StudyMaterial.institution_id == institution_id,
            StudyMaterial.is_active == True
        ).group_by(StudyMaterial.material_type).all()
        
        recent = self.db.query(StudyMaterial).filter(
            StudyMaterial.institution_id == institution_id,
            StudyMaterial.is_active == True
        ).order_by(desc(StudyMaterial.created_at)).limit(5).all()
        
        popular = self.db.query(StudyMaterial).filter(
            StudyMaterial.institution_id == institution_id,
            StudyMaterial.is_active == True
        ).order_by(desc(StudyMaterial.view_count)).limit(5).all()
        
        bookmarked_count = 0
        if user_id:
            bookmarked_count = self.db.query(func.count(MaterialBookmark.id)).filter(
                MaterialBookmark.user_id == user_id,
                MaterialBookmark.institution_id == institution_id
            ).scalar()
            
            for material in recent + popular:
                material.is_bookmarked = self.is_bookmarked(material.id, user_id)
                bookmark = self.get_bookmark(material.id, user_id)
                material.is_favorite = bookmark.is_favorite if bookmark else False
        
        return {
            'total_materials': total_materials,
            'total_views': stats.total_views or 0,
            'total_downloads': stats.total_downloads or 0,
            'materials_by_type': {str(t): c for t, c in by_type},
            'recent_uploads': recent,
            'popular_materials': popular,
            'bookmarked_count': bookmarked_count
        }
    
    def create_tag(
        self, tag_data: MaterialTagCreate, institution_id: int
    ) -> MaterialTag:
        tag = MaterialTag(
            **tag_data.model_dump(),
            institution_id=institution_id
        )
        self.db.add(tag)
        self.db.commit()
        self.db.refresh(tag)
        return tag
    
    def get_tags(self, institution_id: int) -> List[MaterialTag]:
        return self.db.query(MaterialTag).filter(
            MaterialTag.institution_id == institution_id,
            MaterialTag.is_active == True
        ).order_by(desc(MaterialTag.usage_count)).all()
    
    def _update_tag_usage(self, tags: List[str], institution_id: int):
        for tag_name in tags:
            tag = self.db.query(MaterialTag).filter(
                MaterialTag.institution_id == institution_id,
                MaterialTag.name == tag_name
            ).first()
            
            if tag:
                tag.usage_count += 1
            else:
                new_tag = MaterialTag(
                    institution_id=institution_id,
                    name=tag_name,
                    usage_count=1
                )
                self.db.add(new_tag)
        
        self.db.commit()
