from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, date, timedelta
from decimal import Decimal
from src.database import get_db
from src.models.user import User
from src.models.library import Book, BookCategory, BookIssue, LibrarySettings
from src.models.student import Student
from src.dependencies.auth import get_current_user
from src.schemas.library import (
    BookCategoryCreate,
    BookCategoryUpdate,
    BookCategoryResponse,
    BookCreate,
    BookUpdate,
    BookResponse,
    BookIssueCreate,
    BookReturnInput,
    BookIssueUpdate,
    BookIssueResponse,
    BookIssueWithDetails,
    LibrarySettingsCreate,
    LibrarySettingsUpdate,
    LibrarySettingsResponse,
    OverdueBookReport
)

router = APIRouter()


# Book Categories
@router.post("/categories", response_model=BookCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: BookCategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != category_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    category = BookCategory(**category_data.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("/categories", response_model=List[BookCategoryResponse])
async def list_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    categories = db.query(BookCategory).filter(
        BookCategory.institution_id == current_user.institution_id,
        BookCategory.is_active == True
    ).all()
    return categories


# Books
@router.post("/books", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book(
    book_data: BookCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != book_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    # Check if accession number already exists
    existing = db.query(Book).filter(
        Book.institution_id == book_data.institution_id,
        Book.accession_number == book_data.accession_number
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Accession number already exists"
        )

    book = Book(**book_data.model_dump(), available_copies=book_data.total_copies)
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


@router.get("/books", response_model=dict)
async def list_books(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    author: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Book).filter(Book.institution_id == current_user.institution_id)
    
    if search:
        query = query.filter(
            or_(
                Book.title.ilike(f"%{search}%"),
                Book.author.ilike(f"%{search}%"),
                Book.isbn.ilike(f"%{search}%")
            )
        )
    if category_id:
        query = query.filter(Book.category_id == category_id)
    if status:
        query = query.filter(Book.status == status)
    if author:
        query = query.filter(Book.author.ilike(f"%{author}%"))
    if is_active is not None:
        query = query.filter(Book.is_active == is_active)
    
    total = query.count()
    books = query.offset(skip).limit(limit).all()
    
    return {
        "items": books,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/books/{book_id}", response_model=BookResponse)
async def get_book(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(
        Book.id == book_id,
        Book.institution_id == current_user.institution_id
    ).first()
    
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    return book


@router.put("/books/{book_id}", response_model=BookResponse)
async def update_book(
    book_id: int,
    update_data: BookUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(
        Book.id == book_id,
        Book.institution_id == current_user.institution_id
    ).first()
    
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(book, field, value)
    
    db.commit()
    db.refresh(book)
    return book


# Book Issues
@router.post("/issues", response_model=BookIssueResponse, status_code=status.HTTP_201_CREATED)
async def issue_book(
    issue_data: BookIssueCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != issue_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    # Check book availability
    book = db.query(Book).filter(Book.id == issue_data.book_id).first()
    if not book or book.available_copies < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Book not available"
        )
    
    # Check if student has reached max books limit
    settings = db.query(LibrarySettings).filter(
        LibrarySettings.institution_id == issue_data.institution_id
    ).first()
    
    if settings:
        active_issues = db.query(BookIssue).filter(
            BookIssue.student_id == issue_data.student_id,
            BookIssue.status == "active"
        ).count()
        
        if active_issues >= settings.max_books_per_student:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Student has reached maximum book limit ({settings.max_books_per_student})"
            )

    issue = BookIssue(**issue_data.model_dump(), issued_by=current_user.id)
    db.add(issue)
    
    # Update book availability
    book.available_copies -= 1
    if book.available_copies == 0:
        book.status = "issued"
    
    db.commit()
    db.refresh(issue)
    return issue


@router.post("/issues/{issue_id}/return", response_model=BookIssueResponse)
async def return_book(
    issue_id: int,
    return_data: BookReturnInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    issue = db.query(BookIssue).filter(
        BookIssue.id == issue_id,
        BookIssue.institution_id == current_user.institution_id
    ).first()
    
    if not issue:
        raise HTTPException(status_code=404, detail="Issue record not found")
    
    if issue.status == "returned":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Book already returned"
        )
    
    # Calculate fine if overdue
    fine_amount = Decimal("0.00")
    if return_data.return_date > issue.due_date:
        settings = db.query(LibrarySettings).filter(
            LibrarySettings.institution_id == issue.institution_id
        ).first()
        
        if settings:
            days_overdue = (return_data.return_date - issue.due_date).days
            fine_amount = Decimal(str(days_overdue)) * settings.fine_per_day
            
            if settings.max_fine_amount:
                fine_amount = min(fine_amount, settings.max_fine_amount)
    
    issue.return_date = return_data.return_date
    issue.status = "returned"
    issue.fine_amount = fine_amount
    issue.fine_paid = return_data.fine_paid
    issue.returned_to = current_user.id
    
    if return_data.remarks:
        issue.remarks = return_data.remarks
    
    # Update book availability
    book = db.query(Book).filter(Book.id == issue.book_id).first()
    if book:
        book.available_copies += 1
        if book.available_copies > 0 and book.status == "issued":
            book.status = "available"
    
    db.commit()
    db.refresh(issue)
    return issue


@router.get("/issues", response_model=dict)
async def list_issues(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    student_id: Optional[int] = Query(None),
    book_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(BookIssue).filter(BookIssue.institution_id == current_user.institution_id)
    
    if student_id:
        query = query.filter(BookIssue.student_id == student_id)
    if book_id:
        query = query.filter(BookIssue.book_id == book_id)
    if status:
        query = query.filter(BookIssue.status == status)
    
    total = query.count()
    issues = query.order_by(BookIssue.issue_date.desc()).offset(skip).limit(limit).all()
    
    return {
        "items": issues,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/overdue", response_model=List[OverdueBookReport])
async def get_overdue_books(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    
    overdue_issues = db.query(
        BookIssue.id,
        BookIssue.student_id,
        BookIssue.issue_date,
        BookIssue.due_date,
        BookIssue.fine_amount,
        Student.first_name,
        Student.last_name,
        Book.title
    ).join(
        Student, BookIssue.student_id == Student.id
    ).join(
        Book, BookIssue.book_id == Book.id
    ).filter(
        BookIssue.institution_id == current_user.institution_id,
        BookIssue.status == "active",
        BookIssue.due_date < today
    ).all()
    
    results = []
    for issue in overdue_issues:
        days_overdue = (today - issue.due_date).days
        
        results.append(OverdueBookReport(
            issue_id=issue.id,
            student_id=issue.student_id,
            student_name=f"{issue.first_name} {issue.last_name}",
            book_title=issue.title,
            issue_date=issue.issue_date,
            due_date=issue.due_date,
            days_overdue=days_overdue,
            fine_amount=issue.fine_amount
        ))
    
    return results


# Library Settings
@router.post("/settings", response_model=LibrarySettingsResponse, status_code=status.HTTP_201_CREATED)
async def create_settings(
    settings_data: LibrarySettingsCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != settings_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    existing = db.query(LibrarySettings).filter(
        LibrarySettings.institution_id == settings_data.institution_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Settings already exist"
        )

    settings = LibrarySettings(**settings_data.model_dump())
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


@router.get("/settings", response_model=LibrarySettingsResponse)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = db.query(LibrarySettings).filter(
        LibrarySettings.institution_id == current_user.institution_id
    ).first()
    
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    return settings


@router.put("/settings", response_model=LibrarySettingsResponse)
async def update_settings(
    update_data: LibrarySettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = db.query(LibrarySettings).filter(
        LibrarySettings.institution_id == current_user.institution_id
    ).first()
    
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    
    db.commit()
    db.refresh(settings)
    return settings
