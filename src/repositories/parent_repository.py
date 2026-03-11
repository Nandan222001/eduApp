from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from src.models.student import Parent, StudentParent, Student


class ParentRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_user_id(self, user_id: int, institution_id: int) -> Optional[Parent]:
        """Get parent by user_id and institution_id"""
        return self.db.query(Parent).filter(
            Parent.user_id == user_id,
            Parent.institution_id == institution_id,
            Parent.is_active == True
        ).first()
    
    def get_by_id(self, parent_id: int) -> Optional[Parent]:
        """Get parent by id"""
        return self.db.query(Parent).filter(Parent.id == parent_id).first()
    
    def get_children(self, parent_id: int) -> List[Student]:
        """Get all children for a parent"""
        return (
            self.db.query(Student)
            .join(StudentParent, StudentParent.student_id == Student.id)
            .filter(
                StudentParent.parent_id == parent_id,
                Student.is_active == True
            )
            .all()
        )
    
    def verify_parent_child_relationship(
        self,
        parent_id: int,
        student_id: int
    ) -> bool:
        """Verify that parent has access to student"""
        return self.db.query(StudentParent).filter(
            StudentParent.parent_id == parent_id,
            StudentParent.student_id == student_id
        ).first() is not None
    
    def create_parent(self, parent: Parent) -> Parent:
        """Create a new parent"""
        self.db.add(parent)
        self.db.commit()
        self.db.refresh(parent)
        return parent
    
    def update_parent(self, parent: Parent) -> Parent:
        """Update parent information"""
        self.db.commit()
        self.db.refresh(parent)
        return parent
    
    def link_parent_to_student(
        self,
        parent_id: int,
        student_id: int,
        relation_type: str,
        is_primary_contact: bool = False
    ) -> StudentParent:
        """Link parent to student"""
        student_parent = StudentParent(
            parent_id=parent_id,
            student_id=student_id,
            relation_type=relation_type,
            is_primary_contact=is_primary_contact
        )
        self.db.add(student_parent)
        self.db.commit()
        self.db.refresh(student_parent)
        return student_parent
    
    def unlink_parent_from_student(self, parent_id: int, student_id: int) -> None:
        """Unlink parent from student"""
        student_parent = self.db.query(StudentParent).filter(
            StudentParent.parent_id == parent_id,
            StudentParent.student_id == student_id
        ).first()
        if student_parent:
            self.db.delete(student_parent)
            self.db.commit()
