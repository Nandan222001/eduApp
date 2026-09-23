from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from fastapi import HTTPException, status
from src.models.institution import Institution
from src.schemas.institution import InstitutionCreate, InstitutionUpdate


class InstitutionService:
    def __init__(self, db: Session):
        self.db = db

    def create_institution(self, institution_data: InstitutionCreate) -> Institution:
        # Only OR in a `domain ==` clause when a domain was actually
        # supplied. `Institution.domain == None` is translated by
        # SQLAlchemy to `domain IS NULL`, so leaving it in unconditionally
        # meant creating a second institution with no domain (a common,
        # legitimate case -- domain is optional) would match *any* other
        # existing domain-less institution via the `or_`, and then
        # `existing.domain == institution_data.domain` (`None == None`)
        # would spuriously report a "domain already exists" conflict even
        # though neither institution actually has a domain. Confirmed this
        # broke institution creation as soon as one other domain-less
        # institution existed.
        conditions = [Institution.slug == institution_data.slug]
        if institution_data.domain:
            conditions.append(Institution.domain == institution_data.domain)
        existing = self.db.query(Institution).filter(or_(*conditions)).first()

        if existing:
            if existing.slug == institution_data.slug:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Institution with this slug already exists"
                )
            if institution_data.domain and existing.domain == institution_data.domain:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Institution with this domain already exists"
                )

        # `name` is also unique at the DB level (Institution.name,
        # unique=True) but was never checked here, so a duplicate name
        # surfaced as an unhandled IntegrityError -> 500 instead of a clean
        # 400. Checked explicitly, same as slug/domain.
        existing_name = self.db.query(Institution).filter(
            Institution.name == institution_data.name
        ).first()
        if existing_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Institution with this name already exists"
            )

        institution = Institution(**institution_data.model_dump())
        self.db.add(institution)
        self.db.commit()
        self.db.refresh(institution)
        return institution

    def get_institution(self, institution_id: int) -> Optional[Institution]:
        return self.db.query(Institution).filter(Institution.id == institution_id).first()

    def get_institution_by_slug(self, slug: str) -> Optional[Institution]:
        return self.db.query(Institution).filter(Institution.slug == slug).first()

    def get_institution_by_domain(self, domain: str) -> Optional[Institution]:
        return self.db.query(Institution).filter(Institution.domain == domain).first()

    def list_institutions(
        self, 
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Tuple[List[Institution], int]:
        query = self.db.query(Institution)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Institution.name.ilike(search_pattern),
                    Institution.slug.ilike(search_pattern),
                    Institution.domain.ilike(search_pattern)
                )
            )
        
        if is_active is not None:
            query = query.filter(Institution.is_active == is_active)
        
        total = query.count()
        institutions = query.order_by(Institution.created_at.desc()).offset(skip).limit(limit).all()
        
        return institutions, total

    def update_institution(
        self, institution_id: int, institution_data: InstitutionUpdate
    ) -> Optional[Institution]:
        institution = self.get_institution(institution_id)
        if not institution:
            return None
        
        update_data = institution_data.model_dump(exclude_unset=True)

        if 'domain' in update_data and update_data['domain']:
            existing = self.db.query(Institution).filter(
                Institution.domain == update_data['domain'],
                Institution.id != institution_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Institution with this domain already exists"
                )

        # Same gap as create_institution: `name` is unique at the DB level
        # but was never checked here, so renaming an institution to a name
        # already in use surfaced as an unhandled IntegrityError -> 500.
        if 'name' in update_data and update_data['name']:
            existing_name = self.db.query(Institution).filter(
                Institution.name == update_data['name'],
                Institution.id != institution_id
            ).first()
            if existing_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Institution with this name already exists"
                )

        for key, value in update_data.items():
            setattr(institution, key, value)
        
        self.db.commit()
        self.db.refresh(institution)
        return institution

    def delete_institution(self, institution_id: int) -> bool:
        institution = self.get_institution(institution_id)
        if not institution:
            return False
        
        self.db.delete(institution)
        self.db.commit()
        return True

    def get_institution_stats(self, institution_id: int) -> dict:
        from src.models.user import User
        from src.models.teacher import Teacher
        from src.models.student import Student
        from src.models.academic import AcademicYear, Grade, Section, Subject
        
        stats = {
            "total_users": self.db.query(func.count(User.id)).filter(User.institution_id == institution_id).scalar(),
            "active_users": self.db.query(func.count(User.id)).filter(
                User.institution_id == institution_id, User.is_active == True
            ).scalar(),
            "total_teachers": self.db.query(func.count(Teacher.id)).filter(
                Teacher.institution_id == institution_id
            ).scalar(),
            "active_teachers": self.db.query(func.count(Teacher.id)).filter(
                Teacher.institution_id == institution_id, Teacher.is_active == True
            ).scalar(),
            "total_students": self.db.query(func.count(Student.id)).filter(
                Student.institution_id == institution_id
            ).scalar(),
            "active_students": self.db.query(func.count(Student.id)).filter(
                Student.institution_id == institution_id, Student.is_active == True
            ).scalar(),
            "total_academic_years": self.db.query(func.count(AcademicYear.id)).filter(
                AcademicYear.institution_id == institution_id
            ).scalar(),
            "total_grades": self.db.query(func.count(Grade.id)).filter(
                Grade.institution_id == institution_id
            ).scalar(),
            "total_sections": self.db.query(func.count(Section.id)).filter(
                Section.institution_id == institution_id
            ).scalar(),
            "total_subjects": self.db.query(func.count(Subject.id)).filter(
                Subject.institution_id == institution_id
            ).scalar(),
        }
        
        return stats
