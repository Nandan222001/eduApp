from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from src.repositories.content_marketplace_repository import (
    StudentContentRepository, ContentReviewRepository, ContentPurchaseRepository,
    StudentCreditsRepository
)
from src.models.content_marketplace import (
    ContentStatus, ModerationStatus, PlagiarismStatus, TransactionType
)
from src.schemas.content_marketplace import (
    StudentContentCreate, StudentContentUpdate, ContentReviewCreate,
    ContentPurchaseCreate, CreatorAnalyticsResponse
)


class ContentMarketplaceService:
    def __init__(self, db: Session):
        self.db = db
        self.content_repo = StudentContentRepository(db)
        self.review_repo = ContentReviewRepository(db)
        self.purchase_repo = ContentPurchaseRepository(db)
        self.credits_repo = StudentCreditsRepository(db)
    
    def create_content(
        self,
        institution_id: int,
        creator_student_id: int,
        data: StudentContentCreate
    ):
        content_data = data.dict()
        content_data['institution_id'] = institution_id
        content_data['creator_student_id'] = creator_student_id
        content_data['status'] = ContentStatus.DRAFT
        content_data['moderation_status'] = ModerationStatus.PENDING
        content_data['plagiarism_status'] = PlagiarismStatus.NOT_CHECKED
        
        if data.tags:
            content_data['tags'] = data.tags
        
        return self.content_repo.create(content_data)
    
    def update_content(
        self,
        content_id: int,
        data: StudentContentUpdate
    ):
        update_data = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
        return self.content_repo.update(content_id, update_data)
    
    def submit_for_review(self, content_id: int):
        update_data = {
            'status': ContentStatus.PENDING_REVIEW,
            'moderation_status': ModerationStatus.PENDING
        }
        return self.content_repo.update(content_id, update_data)
    
    def search_contents(
        self,
        institution_id: int,
        filters: Dict[str, Any],
        skip: int = 0,
        limit: int = 20
    ):
        return self.content_repo.search(institution_id, filters, skip, limit)
    
    def get_content_detail(self, content_id: int, student_id: Optional[int] = None):
        content = self.content_repo.get_by_id(content_id)
        if not content:
            return None

        # `increment_views` re-fetches this same identity-mapped row and
        # calls db.commit(). SQLAlchemy's Session defaults to
        # expire_on_commit=True, which -- unlike normal attribute access --
        # actually *empties* `content.__dict__` of every mapped column so it
        # can be lazily reloaded on next access. Building `response_data`
        # from `content.__dict__` used to happen *after* this call, so it
        # silently unpacked almost nothing (no `institution_id`, no
        # `price_credits`, etc.), which crashed every single
        # `GET /contents/{content_id}` request downstream (the router reads
        # `content['institution_id']` right after calling this). Building
        # the response dict first, while the row's columns are still
        # populated, and only incrementing views afterward (its return
        # value isn't used) fixes this without changing behavior.
        response_data = {
            **content.__dict__,
            'is_purchased': False,
            'can_download': False
        }

        if student_id:
            purchase = self.purchase_repo.get_by_content_and_buyer(content_id, student_id)
            response_data['is_purchased'] = purchase is not None
            response_data['can_download'] = (
                purchase is not None or
                content.price_credits == 0 or
                content.creator_student_id == student_id
            )

        self.content_repo.increment_views(content_id)

        return response_data
    
    def purchase_content(
        self,
        institution_id: int,
        buyer_student_id: int,
        content_id: int
    ):
        content = self.content_repo.get_by_id(content_id)
        if not content:
            raise ValueError("Content not found")
        
        if content.creator_student_id == buyer_student_id:
            raise ValueError("Cannot purchase own content")
        
        existing_purchase = self.purchase_repo.get_by_content_and_buyer(
            content_id, buyer_student_id
        )
        if existing_purchase:
            raise ValueError("Content already purchased")
        
        buyer_balance = self.credits_repo.get_or_create_balance(
            institution_id, buyer_student_id
        )
        
        if buyer_balance.total_credits < content.price_credits:
            raise ValueError("Insufficient credits")
        
        creator_balance = self.credits_repo.get_or_create_balance(
            institution_id, content.creator_student_id
        )
        
        transaction_id = str(uuid.uuid4())
        
        purchase_data = {
            'institution_id': institution_id,
            'content_id': content_id,
            'buyer_student_id': buyer_student_id,
            'credits_paid': content.price_credits,
            'transaction_id': transaction_id
        }
        purchase = self.purchase_repo.create(purchase_data)
        
        new_buyer_credits = buyer_balance.total_credits - content.price_credits
        buyer_balance_update = {
            'total_credits': new_buyer_credits,
            'spent_credits': buyer_balance.spent_credits + content.price_credits
        }
        self.credits_repo.update_balance(buyer_balance.id, buyer_balance_update)
        
        buyer_transaction = {
            'institution_id': institution_id,
            'transaction_type': TransactionType.SPEND_PURCHASE,
            'amount': -content.price_credits,
            'balance_after': new_buyer_credits,
            'description': f'Purchased: {content.title}',
            'reference_type': 'content_purchase',
            'reference_id': purchase.id
        }
        self.credits_repo.add_transaction(buyer_balance.id, buyer_transaction)
        
        revenue_share = int(content.price_credits * 0.8)
        new_creator_earnings = creator_balance.total_earnings + revenue_share
        new_creator_credits = creator_balance.total_credits + revenue_share
        
        creator_balance_update = {
            'total_credits': new_creator_credits,
            'earned_credits': creator_balance.earned_credits + revenue_share,
            'total_earnings': new_creator_earnings,
            'pending_earnings': creator_balance.pending_earnings + revenue_share
        }
        self.credits_repo.update_balance(creator_balance.id, creator_balance_update)
        
        creator_transaction = {
            'institution_id': institution_id,
            'transaction_type': TransactionType.EARN_SALE,
            'amount': revenue_share,
            'balance_after': new_creator_credits,
            'description': f'Sale of: {content.title}',
            'reference_type': 'content_sale',
            'reference_id': purchase.id,
            # `CreditTransaction`'s mapped attribute for this JSON column is
            # `metadata_json` (SQLAlchemy reserves the `metadata` attribute
            # name on every Declarative model for the schema registry).
            # Passing 'metadata' here used to silently shadow that class
            # attribute on the new instance instead of persisting to the
            # real column, permanently losing the buyer_id on every creator
            # earning transaction record (no exception -- `hasattr` on
            # `metadata` is true, so the ORM's constructor accepted it).
            'metadata_json': {'buyer_id': buyer_student_id}
        }
        self.credits_repo.add_transaction(creator_balance.id, creator_transaction)
        
        content_update = {
            'sales_count': content.sales_count + 1,
            'revenue_earned': content.revenue_earned + revenue_share
        }
        self.content_repo.update(content_id, content_update)
        
        return purchase
    
    def add_review(
        self,
        institution_id: int,
        reviewer_student_id: int,
        data: ContentReviewCreate
    ):
        existing_review = self.review_repo.get_by_content_and_reviewer(
            data.content_id, reviewer_student_id
        )
        if existing_review:
            raise ValueError("Review already exists")
        
        purchase = self.purchase_repo.get_by_content_and_buyer(
            data.content_id, reviewer_student_id
        )
        
        review_data = {
            'institution_id': institution_id,
            'content_id': data.content_id,
            'reviewer_student_id': reviewer_student_id,
            'rating': data.rating,
            'review_text': data.review_text,
            'is_verified_purchase': purchase is not None
        }
        
        review = self.review_repo.create(review_data)
        self.content_repo.update_rating(data.content_id)
        
        return review
    
    def get_creator_analytics(self, creator_student_id: int) -> CreatorAnalyticsResponse:
        contents = self.content_repo.list_by_creator(creator_student_id, skip=0, limit=1000)
        
        total_contents = len(contents)
        published_contents = sum(1 for c in contents if c.status == ContentStatus.APPROVED)
        pending_review_contents = sum(1 for c in contents if c.status == ContentStatus.PENDING_REVIEW)
        
        total_sales = sum(c.sales_count for c in contents)
        total_revenue = sum(c.revenue_earned for c in contents)
        total_views = sum(c.views_count for c in contents)
        total_downloads = sum(c.downloads_count for c in contents)
        
        ratings = [c.rating for c in contents if c.rating_count > 0]
        average_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0
        
        top_selling = sorted(contents, key=lambda c: c.sales_count, reverse=True)[:5]
        top_selling_contents = [
            {
                'id': c.id,
                'title': c.title,
                'sales_count': c.sales_count,
                'revenue_earned': c.revenue_earned,
                'rating': c.rating
            }
            for c in top_selling
        ]
        
        revenue_by_type = {}
        for content in contents:
            content_type = content.content_type.value
            revenue_by_type[content_type] = revenue_by_type.get(content_type, 0) + content.revenue_earned
        
        return CreatorAnalyticsResponse(
            total_contents=total_contents,
            published_contents=published_contents,
            pending_review_contents=pending_review_contents,
            total_sales=total_sales,
            total_revenue=total_revenue,
            total_views=total_views,
            total_downloads=total_downloads,
            average_rating=average_rating,
            top_selling_contents=top_selling_contents,
            recent_sales=[],
            revenue_by_content_type=revenue_by_type,
            sales_trend=[]
        )
    
    def download_content(self, content_id: int, student_id: int):
        content = self.content_repo.get_by_id(content_id)
        if not content:
            raise ValueError("Content not found")
        
        can_download = (
            content.price_credits == 0 or
            content.creator_student_id == student_id or
            self.purchase_repo.get_by_content_and_buyer(content_id, student_id) is not None
        )
        
        if not can_download:
            raise ValueError("Access denied: purchase required")
        
        self.content_repo.increment_downloads(content_id)
        
        return content
