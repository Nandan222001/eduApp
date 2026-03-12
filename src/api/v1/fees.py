from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, date
from src.database import get_db
from src.models.user import User
from src.models.fee import FeeStructure, FeePayment, FeeWaiver
from src.models.student import Student
from src.models.academic import Grade
from src.dependencies.auth import get_current_user
from src.schemas.fee import (
    FeeStructureCreate,
    FeeStructureUpdate,
    FeeStructureResponse,
    FeePaymentCreate,
    FeePaymentUpdate,
    FeePaymentResponse,
    FeeWaiverCreate,
    FeeWaiverUpdate,
    FeeWaiverResponse,
    StudentOutstandingDues,
    FeeReceiptData
)

router = APIRouter()


@router.post("/structures", response_model=FeeStructureResponse, status_code=status.HTTP_201_CREATED)
async def create_fee_structure(
    fee_data: FeeStructureCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != fee_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create fee structure for this institution"
        )

    fee_structure = FeeStructure(**fee_data.model_dump())
    db.add(fee_structure)
    db.commit()
    db.refresh(fee_structure)
    return fee_structure


@router.get("/structures", response_model=dict)
async def list_fee_structures(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    academic_year_id: Optional[int] = Query(None),
    grade_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(FeeStructure).filter(FeeStructure.institution_id == current_user.institution_id)
    
    if academic_year_id:
        query = query.filter(FeeStructure.academic_year_id == academic_year_id)
    if grade_id:
        query = query.filter(FeeStructure.grade_id == grade_id)
    if category:
        query = query.filter(FeeStructure.category == category)
    if is_active is not None:
        query = query.filter(FeeStructure.is_active == is_active)
    
    total = query.count()
    structures = query.offset(skip).limit(limit).all()
    
    return {
        "items": structures,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/structures/{structure_id}", response_model=FeeStructureResponse)
async def get_fee_structure(
    structure_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    structure = db.query(FeeStructure).filter(
        FeeStructure.id == structure_id,
        FeeStructure.institution_id == current_user.institution_id
    ).first()
    
    if not structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")
    
    return structure


@router.put("/structures/{structure_id}", response_model=FeeStructureResponse)
async def update_fee_structure(
    structure_id: int,
    update_data: FeeStructureUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    structure = db.query(FeeStructure).filter(
        FeeStructure.id == structure_id,
        FeeStructure.institution_id == current_user.institution_id
    ).first()
    
    if not structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(structure, field, value)
    
    db.commit()
    db.refresh(structure)
    return structure


@router.delete("/structures/{structure_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fee_structure(
    structure_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    structure = db.query(FeeStructure).filter(
        FeeStructure.id == structure_id,
        FeeStructure.institution_id == current_user.institution_id
    ).first()
    
    if not structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")
    
    db.delete(structure)
    db.commit()
    return None


@router.post("/payments", response_model=FeePaymentResponse, status_code=status.HTTP_201_CREATED)
async def record_payment(
    payment_data: FeePaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != payment_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to record payment for this institution"
        )
    
    # Generate receipt number
    latest_payment = db.query(FeePayment).filter(
        FeePayment.institution_id == payment_data.institution_id
    ).order_by(FeePayment.id.desc()).first()
    
    if latest_payment:
        last_num = int(latest_payment.receipt_number.split('-')[-1])
        receipt_number = f"RCP-{payment_data.institution_id}-{last_num + 1:06d}"
    else:
        receipt_number = f"RCP-{payment_data.institution_id}-000001"
    
    total_amount = payment_data.amount_paid + payment_data.late_fee - payment_data.discount_amount
    
    payment = FeePayment(
        **payment_data.model_dump(),
        receipt_number=receipt_number,
        total_amount=total_amount,
        collected_by=current_user.id
    )
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/payments", response_model=dict)
async def list_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    student_id: Optional[int] = Query(None),
    fee_structure_id: Optional[int] = Query(None),
    payment_method: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(FeePayment).filter(FeePayment.institution_id == current_user.institution_id)
    
    if student_id:
        query = query.filter(FeePayment.student_id == student_id)
    if fee_structure_id:
        query = query.filter(FeePayment.fee_structure_id == fee_structure_id)
    if payment_method:
        query = query.filter(FeePayment.payment_method == payment_method)
    if start_date:
        query = query.filter(FeePayment.payment_date >= start_date)
    if end_date:
        query = query.filter(FeePayment.payment_date <= end_date)
    
    total = query.count()
    payments = query.order_by(FeePayment.payment_date.desc()).offset(skip).limit(limit).all()
    
    return {
        "items": payments,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/payments/{payment_id}", response_model=FeePaymentResponse)
async def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = db.query(FeePayment).filter(
        FeePayment.id == payment_id,
        FeePayment.institution_id == current_user.institution_id
    ).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return payment


@router.get("/receipts/{receipt_number}", response_model=FeeReceiptData)
async def get_receipt(
    receipt_number: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = db.query(FeePayment).filter(
        FeePayment.receipt_number == receipt_number,
        FeePayment.institution_id == current_user.institution_id
    ).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    student = db.query(Student).filter(Student.id == payment.student_id).first()
    grade = db.query(Grade).filter(Grade.id == student.grade_id).first() if student else None
    fee_structure = db.query(FeeStructure).filter(FeeStructure.id == payment.fee_structure_id).first()
    collector = db.query(User).filter(User.id == payment.collected_by).first()
    
    return FeeReceiptData(
        receipt_number=payment.receipt_number,
        payment_date=payment.payment_date,
        student_name=f"{student.first_name} {student.last_name}" if student else "Unknown",
        grade_name=grade.name if grade else "Unknown",
        fee_structure_name=fee_structure.name if fee_structure else "Unknown",
        amount_paid=payment.amount_paid,
        late_fee=payment.late_fee,
        discount_amount=payment.discount_amount,
        total_amount=payment.total_amount,
        payment_method=payment.payment_method,
        collected_by_name=f"{collector.first_name} {collector.last_name}" if collector else None
    )


@router.get("/outstanding-dues", response_model=List[StudentOutstandingDues])
async def get_outstanding_dues(
    grade_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(
        Student.id.label('student_id'),
        func.concat(Student.first_name, ' ', Student.last_name).label('student_name'),
        Grade.name.label('grade_name'),
        func.coalesce(func.sum(FeeStructure.amount), 0).label('total_fees'),
        func.coalesce(func.sum(FeePayment.amount_paid), 0).label('amount_paid')
    ).join(
        Grade, Student.grade_id == Grade.id
    ).outerjoin(
        FeeStructure, and_(
            FeeStructure.grade_id == Student.grade_id,
            FeeStructure.institution_id == current_user.institution_id
        )
    ).outerjoin(
        FeePayment, and_(
            FeePayment.student_id == Student.id,
            FeePayment.fee_structure_id == FeeStructure.id
        )
    ).filter(
        Student.institution_id == current_user.institution_id
    )
    
    if grade_id:
        query = query.filter(Student.grade_id == grade_id)
    
    query = query.group_by(Student.id, Grade.name)
    
    results = query.all()
    
    outstanding_list = []
    for result in results:
        outstanding = result.total_fees - result.amount_paid
        overdue = 0  # Calculate based on due dates
        
        outstanding_list.append(StudentOutstandingDues(
            student_id=result.student_id,
            student_name=result.student_name,
            grade_name=result.grade_name,
            total_fees=result.total_fees,
            amount_paid=result.amount_paid,
            outstanding_amount=outstanding,
            overdue_amount=overdue
        ))
    
    return outstanding_list


@router.post("/waivers", response_model=FeeWaiverResponse, status_code=status.HTTP_201_CREATED)
async def create_waiver(
    waiver_data: FeeWaiverCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != waiver_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create waiver for this institution"
        )
    
    waiver = FeeWaiver(**waiver_data.model_dump(), approved_by=current_user.id, approved_at=datetime.utcnow())
    db.add(waiver)
    db.commit()
    db.refresh(waiver)
    return waiver


@router.get("/waivers", response_model=dict)
async def list_waivers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    student_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(FeeWaiver).filter(FeeWaiver.institution_id == current_user.institution_id)
    
    if student_id:
        query = query.filter(FeeWaiver.student_id == student_id)
    if is_active is not None:
        query = query.filter(FeeWaiver.is_active == is_active)
    
    total = query.count()
    waivers = query.offset(skip).limit(limit).all()
    
    return {
        "items": waivers,
        "total": total,
        "skip": skip,
        "limit": limit
    }
