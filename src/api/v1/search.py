from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.utils.context import get_current_institution_id
from src.services.search_service import SearchService
from src.schemas.search import (
    SearchQuery,
    SearchResults,
    QuickSearchResults,
    SearchHistoryResponse,
    SearchSuggestionsResponse,
    SearchFilterOptions,
)

router = APIRouter()


@router.post("/search", response_model=SearchResults)
async def global_search(
    search_query: SearchQuery,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    institution_id: int = Depends(get_current_institution_id),
):
    """
    Perform a comprehensive global search across multiple entity types.
    
    - **query**: Search query text (required)
    - **search_types**: Filter by specific entity types (optional)
    - **filters**: Additional filters like grade_id, subject_id, etc. (optional)
    - **limit**: Maximum results per category (default: 10, max: 100)
    - **offset**: Pagination offset (default: 0)
    """
    service = SearchService(db)
    return service.global_search(
        institution_id=institution_id,
        user_id=current_user.id,
        user_role=current_user.role,
        search_query=search_query,
    )


@router.get("/search/quick", response_model=QuickSearchResults)
async def quick_search(
    q: str = Query(..., min_length=1, max_length=500, description="Search query"),
    limit: int = Query(default=10, ge=1, le=50, description="Maximum results"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    institution_id: int = Depends(get_current_institution_id),
):
    """
    Perform a quick search for instant results dropdown.
    Returns a limited set of mixed results from all categories.
    """
    service = SearchService(db)
    return service.quick_search(
        institution_id=institution_id,
        user_id=current_user.id,
        query=q,
        limit=limit,
    )


@router.get("/search/history", response_model=SearchHistoryResponse)
async def get_search_history(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get user's search history.
    """
    service = SearchService(db)
    return service.get_search_history(
        user_id=current_user.id,
        limit=limit,
        offset=offset,
    )


@router.delete("/search/history")
async def clear_search_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Clear user's search history.
    """
    service = SearchService(db)
    service.clear_search_history(user_id=current_user.id)
    return {"message": "Search history cleared successfully"}


@router.get("/search/suggestions", response_model=SearchSuggestionsResponse)
async def get_search_suggestions(
    q: str = Query(..., min_length=1, max_length=500, description="Partial query"),
    limit: int = Query(default=10, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    institution_id: int = Depends(get_current_institution_id),
):
    """
    Get search suggestions based on history and popular searches.
    """
    service = SearchService(db)
    return service.get_search_suggestions(
        institution_id=institution_id,
        user_role=current_user.role,
        query=q,
        limit=limit,
    )


@router.get("/search/filters", response_model=SearchFilterOptions)
async def get_search_filters(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    institution_id: int = Depends(get_current_institution_id),
):
    """
    Get available filter options for search.
    """
    service = SearchService(db)
    return service.get_filter_options(institution_id=institution_id)
