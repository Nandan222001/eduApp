from typing import Optional, List
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from src.database import get_db
from src.models.user import User
from src.models.student import Student
from src.models.journalism import (
    NewspaperEdition,
    Article,
    ArticleReview,
    JournalismMember,
    ArticleAnalytics,
    PublicationStatus,
    ArticleType,
    ReviewStatus,
    JournalismRole,
)
from src.schemas.journalism import (
    NewspaperEditionCreate,
    NewspaperEditionUpdate,
    NewspaperEditionResponse,
    NewspaperEditionDetailResponse,
    ArticleCreate,
    ArticleUpdate,
    ArticleResponse,
    ArticleDetailResponse,
    ArticleSubmitRequest,
    ArticlePublishRequest,
    ArticleReviewCreate,
    ArticleReviewResponse,
    ArticleReviewDetailResponse,
    JournalismMemberCreate,
    JournalismMemberUpdate,
    JournalismMemberResponse,
    JournalismMemberDetailResponse,
    ArticleAnalyticsCreate,
    ArticleAnalyticsResponse,
    ArticleAnalyticsSummary,
    EditionAnalyticsSummary,
    JournalismMemberStats,
    WorkflowStatusUpdate,
)
from src.dependencies.auth import get_current_user
import re

router = APIRouter()


def generate_slug(title: str) -> str:
    """Generate URL-friendly slug from title"""
    slug = title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_-]+', '-', slug)
    slug = slug.strip('-')
    return slug


def calculate_word_count(html_content: str) -> int:
    """Calculate word count from HTML content"""
    text = re.sub(r'<[^>]+>', '', html_content)
    words = text.split()
    return len(words)


# Newspaper Edition Endpoints
@router.post("/editions", response_model=NewspaperEditionResponse, status_code=status.HTTP_201_CREATED)
async def create_edition(
    edition_data: NewspaperEditionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new newspaper edition"""
    if current_user.institution_id != edition_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create edition for this institution"
        )
    
    # Check if edition number already exists
    existing = db.query(NewspaperEdition).filter(
        and_(
            NewspaperEdition.institution_id == edition_data.institution_id,
            NewspaperEdition.edition_number == edition_data.edition_number
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Edition number already exists"
        )
    
    edition = NewspaperEdition(**edition_data.model_dump())
    db.add(edition)
    db.commit()
    db.refresh(edition)
    return edition


@router.get("/editions", response_model=dict)
async def list_editions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    publication_status: Optional[PublicationStatus] = Query(None),
    year: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all newspaper editions"""
    query = db.query(NewspaperEdition).filter(
        NewspaperEdition.institution_id == current_user.institution_id
    )
    
    if publication_status:
        query = query.filter(NewspaperEdition.publication_status == publication_status.value)
    
    if year:
        query = query.filter(func.extract('year', NewspaperEdition.publication_date) == year)
    
    total = query.count()
    editions = query.order_by(desc(NewspaperEdition.publication_date)).offset(skip).limit(limit).all()
    
    return {
        "items": editions,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/editions/{edition_id}", response_model=NewspaperEditionDetailResponse)
async def get_edition(
    edition_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific newspaper edition"""
    edition = db.query(NewspaperEdition).filter(
        and_(
            NewspaperEdition.id == edition_id,
            NewspaperEdition.institution_id == current_user.institution_id
        )
    ).first()
    
    if not edition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Edition not found"
        )
    
    # Get article count
    article_count = db.query(func.count(Article.id)).filter(
        Article.edition_id == edition_id
    ).scalar()
    
    # Get editor name
    editor_name = None
    if edition.editor_in_chief_student_id:
        student = db.query(Student).filter(Student.id == edition.editor_in_chief_student_id).first()
        if student:
            editor_name = f"{student.first_name} {student.last_name}"
    
    response = NewspaperEditionDetailResponse(
        **edition.__dict__,
        article_count=article_count,
        editor_name=editor_name
    )
    return response


@router.put("/editions/{edition_id}", response_model=NewspaperEditionResponse)
async def update_edition(
    edition_id: int,
    edition_data: NewspaperEditionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a newspaper edition"""
    edition = db.query(NewspaperEdition).filter(
        and_(
            NewspaperEdition.id == edition_id,
            NewspaperEdition.institution_id == current_user.institution_id
        )
    ).first()
    
    if not edition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Edition not found"
        )
    
    for field, value in edition_data.model_dump(exclude_unset=True).items():
        setattr(edition, field, value)
    
    db.commit()
    db.refresh(edition)
    return edition


@router.delete("/editions/{edition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_edition(
    edition_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a newspaper edition"""
    edition = db.query(NewspaperEdition).filter(
        and_(
            NewspaperEdition.id == edition_id,
            NewspaperEdition.institution_id == current_user.institution_id
        )
    ).first()
    
    if not edition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Edition not found"
        )
    
    db.delete(edition)
    db.commit()


# Article Endpoints
@router.post("/articles", response_model=ArticleResponse, status_code=status.HTTP_201_CREATED)
async def create_article(
    article_data: ArticleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new article"""
    if current_user.institution_id != article_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create article for this institution"
        )
    
    # Generate slug if not provided
    slug = article_data.slug or generate_slug(article_data.title)
    
    # Calculate word count
    word_count = calculate_word_count(article_data.content_html)
    
    article_dict = article_data.model_dump()
    article_dict['slug'] = slug
    article_dict['word_count'] = word_count
    
    article = Article(**article_dict)
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


@router.get("/articles", response_model=dict)
async def list_articles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    article_type: Optional[ArticleType] = Query(None),
    review_status: Optional[ReviewStatus] = Query(None),
    edition_id: Optional[int] = Query(None),
    author_student_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    featured: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all articles"""
    query = db.query(Article).filter(
        Article.institution_id == current_user.institution_id
    )
    
    if article_type:
        query = query.filter(Article.article_type == article_type.value)
    
    if review_status:
        query = query.filter(Article.review_status == review_status.value)
    
    if edition_id:
        query = query.filter(Article.edition_id == edition_id)
    
    if author_student_id:
        query = query.filter(Article.author_student_id == author_student_id)
    
    if category:
        query = query.filter(Article.category == category)
    
    if featured is not None:
        query = query.filter(Article.featured == featured)
    
    if search:
        query = query.filter(
            or_(
                Article.title.ilike(f"%{search}%"),
                Article.excerpt.ilike(f"%{search}%")
            )
        )
    
    total = query.count()
    articles = query.order_by(desc(Article.submission_date)).offset(skip).limit(limit).all()
    
    return {
        "items": articles,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/articles/published", response_model=dict)
async def list_published_articles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    article_type: Optional[ArticleType] = Query(None),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List published articles"""
    query = db.query(Article).filter(
        and_(
            Article.institution_id == current_user.institution_id,
            Article.review_status == ReviewStatus.APPROVED.value,
            Article.publish_date.isnot(None)
        )
    )
    
    if article_type:
        query = query.filter(Article.article_type == article_type.value)
    
    if category:
        query = query.filter(Article.category == category)
    
    total = query.count()
    articles = query.order_by(desc(Article.publish_date)).offset(skip).limit(limit).all()
    
    return {
        "items": articles,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/articles/{article_id}", response_model=ArticleDetailResponse)
async def get_article(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific article"""
    article = db.query(Article).filter(
        and_(
            Article.id == article_id,
            Article.institution_id == current_user.institution_id
        )
    ).first()
    
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    
    # Get author name
    author_name = None
    if article.author_student_id:
        student = db.query(Student).filter(Student.id == article.author_student_id).first()
        if student:
            author_name = f"{student.first_name} {student.last_name}"
    
    # Get edition number
    edition_number = None
    if article.edition_id:
        edition = db.query(NewspaperEdition).filter(NewspaperEdition.id == article.edition_id).first()
        if edition:
            edition_number = edition.edition_number
    
    # Get review count
    review_count = db.query(func.count(ArticleReview.id)).filter(
        ArticleReview.article_id == article_id
    ).scalar()
    
    response = ArticleDetailResponse(
        **article.__dict__,
        author_name=author_name,
        edition_number=edition_number,
        review_count=review_count
    )
    return response


@router.put("/articles/{article_id}", response_model=ArticleResponse)
async def update_article(
    article_id: int,
    article_data: ArticleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an article"""
    article = db.query(Article).filter(
        and_(
            Article.id == article_id,
            Article.institution_id == current_user.institution_id
        )
    ).first()
    
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    
    update_data = article_data.model_dump(exclude_unset=True)
    
    # Update slug if title changed
    if 'title' in update_data and 'slug' not in update_data:
        update_data['slug'] = generate_slug(update_data['title'])
    
    # Recalculate word count if content changed
    if 'content_html' in update_data:
        update_data['word_count'] = calculate_word_count(update_data['content_html'])
    
    for field, value in update_data.items():
        setattr(article, field, value)
    
    db.commit()
    db.refresh(article)
    return article


@router.delete("/articles/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an article"""
    article = db.query(Article).filter(
        and_(
            Article.id == article_id,
            Article.institution_id == current_user.institution_id
        )
    ).first()
    
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    
    db.delete(article)
    db.commit()


# Article Workflow Endpoints
@router.post("/articles/{article_id}/submit", response_model=ArticleResponse)
async def submit_article_for_review(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit an article for peer review"""
    article = db.query(Article).filter(
        and_(
            Article.id == article_id,
            Article.institution_id == current_user.institution_id
        )
    ).first()
    
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    
    if article.review_status != ReviewStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Article is not in pending status"
        )
    
    article.review_status = ReviewStatus.PEER_REVIEW.value
    db.commit()
    db.refresh(article)
    return article


@router.post("/articles/{article_id}/publish", response_model=ArticleResponse)
async def publish_article(
    article_id: int,
    publish_data: ArticlePublishRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Publish an approved article"""
    article = db.query(Article).filter(
        and_(
            Article.id == article_id,
            Article.institution_id == current_user.institution_id
        )
    ).first()
    
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    
    if article.review_status != ReviewStatus.APPROVED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Article must be approved before publishing"
        )
    
    article.publish_date = publish_data.publish_date or datetime.utcnow()
    db.commit()
    db.refresh(article)
    return article


@router.put("/articles/{article_id}/workflow", response_model=ArticleResponse)
async def update_workflow_status(
    article_id: int,
    workflow_data: WorkflowStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update article workflow status"""
    article = db.query(Article).filter(
        and_(
            Article.id == article_id,
            Article.institution_id == current_user.institution_id
        )
    ).first()
    
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    
    article.review_status = workflow_data.review_status.value
    if workflow_data.editor_notes:
        article.editor_notes = workflow_data.editor_notes
    
    db.commit()
    db.refresh(article)
    return article


# Article Review Endpoints
@router.post("/reviews", response_model=ArticleReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_data: ArticleReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a review for an article"""
    # Verify article exists and belongs to institution
    article = db.query(Article).filter(
        and_(
            Article.id == review_data.article_id,
            Article.institution_id == current_user.institution_id
        )
    ).first()
    
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    
    review = ArticleReview(**review_data.model_dump())
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.get("/articles/{article_id}/reviews", response_model=List[ArticleReviewDetailResponse])
async def get_article_reviews(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all reviews for an article"""
    # Verify article exists
    article = db.query(Article).filter(
        and_(
            Article.id == article_id,
            Article.institution_id == current_user.institution_id
        )
    ).first()
    
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    
    reviews = db.query(ArticleReview).filter(
        ArticleReview.article_id == article_id
    ).order_by(desc(ArticleReview.reviewed_at)).all()
    
    # Add reviewer names
    result = []
    for review in reviews:
        reviewer_name = None
        if review.reviewer_student_id:
            student = db.query(Student).filter(Student.id == review.reviewer_student_id).first()
            if student:
                reviewer_name = f"{student.first_name} {student.last_name}"
        elif review.reviewer_user_id:
            user = db.query(User).filter(User.id == review.reviewer_user_id).first()
            if user:
                reviewer_name = f"{user.first_name} {user.last_name}"
        
        result.append(ArticleReviewDetailResponse(
            **review.__dict__,
            reviewer_name=reviewer_name
        ))
    
    return result


# Journalism Member Endpoints
@router.post("/members", response_model=JournalismMemberResponse, status_code=status.HTTP_201_CREATED)
async def assign_member_role(
    member_data: JournalismMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Assign a journalism role to a student"""
    if current_user.institution_id != member_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create member for this institution"
        )
    
    # Check if student exists
    student = db.query(Student).filter(
        and_(
            Student.id == member_data.student_id,
            Student.institution_id == member_data.institution_id
        )
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Check if member role already exists
    existing = db.query(JournalismMember).filter(
        and_(
            JournalismMember.institution_id == member_data.institution_id,
            JournalismMember.student_id == member_data.student_id,
            JournalismMember.role == member_data.role.value
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student already has this role"
        )
    
    member = JournalismMember(**member_data.model_dump())
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.get("/members", response_model=dict)
async def list_members(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    role: Optional[JournalismRole] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all journalism members"""
    query = db.query(JournalismMember).filter(
        JournalismMember.institution_id == current_user.institution_id
    )
    
    if role:
        query = query.filter(JournalismMember.role == role.value)
    
    if is_active is not None:
        query = query.filter(JournalismMember.is_active == is_active)
    
    total = query.count()
    members = query.order_by(JournalismMember.join_date).offset(skip).limit(limit).all()
    
    return {
        "items": members,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/members/{member_id}", response_model=JournalismMemberDetailResponse)
async def get_member(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific journalism member"""
    member = db.query(JournalismMember).filter(
        and_(
            JournalismMember.id == member_id,
            JournalismMember.institution_id == current_user.institution_id
        )
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    # Get student name
    student_name = None
    student = db.query(Student).filter(Student.id == member.student_id).first()
    if student:
        student_name = f"{student.first_name} {student.last_name}"
    
    # Get article count
    article_count = db.query(func.count(Article.id)).filter(
        Article.author_student_id == member.student_id
    ).scalar()
    
    response = JournalismMemberDetailResponse(
        **member.__dict__,
        student_name=student_name,
        article_count=article_count
    )
    return response


@router.put("/members/{member_id}", response_model=JournalismMemberResponse)
async def update_member(
    member_id: int,
    member_data: JournalismMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a journalism member"""
    member = db.query(JournalismMember).filter(
        and_(
            JournalismMember.id == member_id,
            JournalismMember.institution_id == current_user.institution_id
        )
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    for field, value in member_data.model_dump(exclude_unset=True).items():
        setattr(member, field, value)
    
    db.commit()
    db.refresh(member)
    return member


@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a journalism member"""
    member = db.query(JournalismMember).filter(
        and_(
            JournalismMember.id == member_id,
            JournalismMember.institution_id == current_user.institution_id
        )
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    db.delete(member)
    db.commit()


# Analytics Endpoints
@router.post("/analytics/view", response_model=ArticleAnalyticsResponse, status_code=status.HTTP_201_CREATED)
async def track_article_view(
    analytics_data: ArticleAnalyticsCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Track an article view"""
    # Verify article exists
    article = db.query(Article).filter(
        and_(
            Article.id == analytics_data.article_id,
            Article.institution_id == current_user.institution_id
        )
    ).first()
    
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    
    # Increment view count
    article.view_count += 1
    
    # Create analytics record
    analytics = ArticleAnalytics(**analytics_data.model_dump())
    db.add(analytics)
    db.commit()
    db.refresh(analytics)
    return analytics


@router.get("/analytics/articles/{article_id}", response_model=ArticleAnalyticsSummary)
async def get_article_analytics(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get analytics summary for an article"""
    article = db.query(Article).filter(
        and_(
            Article.id == article_id,
            Article.institution_id == current_user.institution_id
        )
    ).first()
    
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    
    # Get analytics
    analytics = db.query(
        func.count(ArticleAnalytics.id).label('total_views'),
        func.count(func.distinct(ArticleAnalytics.user_id)).label('unique_viewers'),
        func.avg(ArticleAnalytics.time_spent_seconds).label('avg_time_spent'),
        func.avg(ArticleAnalytics.engagement_score).label('avg_engagement_score')
    ).filter(ArticleAnalytics.article_id == article_id).first()
    
    return ArticleAnalyticsSummary(
        article_id=article.id,
        article_title=article.title,
        total_views=analytics.total_views or 0,
        unique_viewers=analytics.unique_viewers or 0,
        avg_time_spent=float(analytics.avg_time_spent) if analytics.avg_time_spent else None,
        avg_engagement_score=float(analytics.avg_engagement_score) if analytics.avg_engagement_score else None
    )


@router.get("/analytics/editions/{edition_id}", response_model=EditionAnalyticsSummary)
async def get_edition_analytics(
    edition_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get analytics summary for an edition"""
    edition = db.query(NewspaperEdition).filter(
        and_(
            NewspaperEdition.id == edition_id,
            NewspaperEdition.institution_id == current_user.institution_id
        )
    ).first()
    
    if not edition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Edition not found"
        )
    
    # Get edition articles
    articles = db.query(Article).filter(Article.edition_id == edition_id).all()
    total_articles = len(articles)
    
    # Get total views and unique viewers across all articles
    analytics = db.query(
        func.count(ArticleAnalytics.id).label('total_views'),
        func.count(func.distinct(ArticleAnalytics.user_id)).label('unique_viewers')
    ).join(Article).filter(Article.edition_id == edition_id).first()
    
    # Get top articles
    top_articles = []
    for article in sorted(articles, key=lambda x: x.view_count, reverse=True)[:5]:
        article_analytics = db.query(
            func.count(ArticleAnalytics.id).label('total_views'),
            func.count(func.distinct(ArticleAnalytics.user_id)).label('unique_viewers'),
            func.avg(ArticleAnalytics.time_spent_seconds).label('avg_time_spent'),
            func.avg(ArticleAnalytics.engagement_score).label('avg_engagement_score')
        ).filter(ArticleAnalytics.article_id == article.id).first()
        
        top_articles.append(ArticleAnalyticsSummary(
            article_id=article.id,
            article_title=article.title,
            total_views=article_analytics.total_views or 0,
            unique_viewers=article_analytics.unique_viewers or 0,
            avg_time_spent=float(article_analytics.avg_time_spent) if article_analytics.avg_time_spent else None,
            avg_engagement_score=float(article_analytics.avg_engagement_score) if article_analytics.avg_engagement_score else None
        ))
    
    return EditionAnalyticsSummary(
        edition_id=edition.id,
        edition_number=edition.edition_number,
        total_articles=total_articles,
        total_views=analytics.total_views or 0,
        unique_viewers=analytics.unique_viewers or 0,
        top_articles=top_articles
    )


@router.get("/analytics/members/stats", response_model=List[JournalismMemberStats])
async def get_member_statistics(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get statistics for journalism members"""
    members = db.query(JournalismMember).filter(
        and_(
            JournalismMember.institution_id == current_user.institution_id,
            JournalismMember.is_active == True
        )
    ).all()
    
    stats = []
    for member in members:
        # Get student name
        student = db.query(Student).filter(Student.id == member.student_id).first()
        student_name = f"{student.first_name} {student.last_name}" if student else "Unknown"
        
        # Get articles written count
        articles_written = db.query(func.count(Article.id)).filter(
            Article.author_student_id == member.student_id
        ).scalar()
        
        # Get total views
        total_views = db.query(func.sum(Article.view_count)).filter(
            Article.author_student_id == member.student_id
        ).scalar() or 0
        
        # Get average rating from reviews
        avg_rating = db.query(func.avg(ArticleReview.rating)).join(Article).filter(
            Article.author_student_id == member.student_id
        ).scalar()
        
        stats.append(JournalismMemberStats(
            member_id=member.id,
            student_name=student_name,
            role=member.role,
            articles_written=articles_written or 0,
            total_views=int(total_views),
            avg_rating=float(avg_rating) if avg_rating else None
        ))
    
    # Sort by articles written
    stats.sort(key=lambda x: x.articles_written, reverse=True)
    return stats[:limit]
