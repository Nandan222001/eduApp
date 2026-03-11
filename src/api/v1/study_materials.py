from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.services.study_material_service import StudyMaterialService
from src.schemas.study_material import (
    StudyMaterialCreate, StudyMaterialUpdate, StudyMaterialResponse,
    MaterialBookmarkCreate, MaterialBookmarkUpdate, MaterialBookmarkResponse,
    MaterialShareCreate, MaterialShareResponse, MaterialSearchFilters,
    MaterialStatsResponse, MaterialHierarchyNode, AutocompleteResponse,
    MaterialUploadResponse, MaterialTagCreate, MaterialTagResponse
)
from src.models.study_material import MaterialType
from src.utils.s3_client import S3Client
import mimetypes
import json
from pathlib import Path

router = APIRouter(prefix="/study-materials", tags=["Study Materials"])


def get_material_type_from_mime(mime_type: str) -> MaterialType:
    if mime_type.startswith('application/pdf'):
        return MaterialType.PDF
    elif mime_type.startswith('video/'):
        return MaterialType.VIDEO
    elif mime_type.startswith('audio/'):
        return MaterialType.AUDIO
    elif mime_type.startswith('image/'):
        return MaterialType.IMAGE
    elif mime_type in ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
        return MaterialType.DOCUMENT
    elif mime_type in ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']:
        return MaterialType.PRESENTATION
    elif mime_type in ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']:
        return MaterialType.SPREADSHEET
    elif mime_type in ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed']:
        return MaterialType.ARCHIVE
    else:
        return MaterialType.OTHER


@router.post("/upload", response_model=MaterialUploadResponse)
async def upload_material(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    subject_id: Optional[int] = Form(None),
    chapter_id: Optional[int] = Form(None),
    topic_id: Optional[int] = Form(None),
    grade_id: Optional[int] = Form(None),
    tags: Optional[str] = Form(None),
    is_public: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        s3_client = S3Client()
        
        file_content = await file.read()
        file_size = len(file_content)
        
        mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or 'application/octet-stream'
        material_type = get_material_type_from_mime(mime_type)
        
        file_path = f"study-materials/{current_user.institution_id}/{material_type.value}/{file.filename}"
        s3_client.upload_file(file_content, file_path, mime_type)
        
        thumbnail_path = None
        preview_path = None
        
        tags_list = json.loads(tags) if tags else []
        
        material_data = StudyMaterialCreate(
            title=title,
            description=description,
            subject_id=subject_id,
            chapter_id=chapter_id,
            topic_id=topic_id,
            grade_id=grade_id,
            file_path=file_path,
            file_name=file.filename,
            file_size=file_size,
            material_type=material_type,
            mime_type=mime_type,
            thumbnail_path=thumbnail_path,
            preview_path=preview_path,
            tags=tags_list,
            is_public=is_public
        )
        
        service = StudyMaterialService(db)
        material = service.create_material(
            material_data,
            current_user.institution_id,
            current_user.id
        )
        
        return MaterialUploadResponse(
            material=material,
            message="Material uploaded successfully"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload material: {str(e)}"
        )


@router.get("/search", response_model=dict)
async def search_materials(
    query: Optional[str] = None,
    material_type: Optional[MaterialType] = None,
    subject_id: Optional[int] = None,
    chapter_id: Optional[int] = None,
    topic_id: Optional[int] = None,
    grade_id: Optional[int] = None,
    tags: Optional[str] = None,
    uploaded_by: Optional[int] = None,
    is_public: Optional[bool] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from datetime import datetime
    
    tags_list = tags.split(',') if tags else None
    
    filters = MaterialSearchFilters(
        query=query,
        material_type=material_type,
        subject_id=subject_id,
        chapter_id=chapter_id,
        topic_id=topic_id,
        grade_id=grade_id,
        tags=tags_list,
        uploaded_by=uploaded_by,
        is_public=is_public,
        date_from=datetime.fromisoformat(date_from) if date_from else None,
        date_to=datetime.fromisoformat(date_to) if date_to else None,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size
    )
    
    service = StudyMaterialService(db)
    materials, total = service.search_materials(
        filters,
        current_user.institution_id,
        current_user.id
    )
    
    return {
        "materials": materials,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/{material_id}", response_model=StudyMaterialResponse)
async def get_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyMaterialService(db)
    material = service.get_material(material_id, current_user.institution_id, current_user.id)
    
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )
    
    return material


@router.put("/{material_id}", response_model=StudyMaterialResponse)
async def update_material(
    material_id: int,
    material_data: StudyMaterialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyMaterialService(db)
    material = service.update_material(
        material_id,
        material_data,
        current_user.institution_id,
        current_user.id
    )
    
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )
    
    return material


@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyMaterialService(db)
    success = service.delete_material(material_id, current_user.institution_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )


@router.post("/{material_id}/view")
async def view_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyMaterialService(db)
    service.view_material(material_id, current_user.id, current_user.institution_id)
    return {"message": "View recorded"}


@router.post("/{material_id}/download")
async def download_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyMaterialService(db)
    material = service.get_material(material_id, current_user.institution_id, current_user.id)
    
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )
    
    service.download_material(material_id, current_user.id, current_user.institution_id)
    
    s3_client = S3Client()
    download_url = s3_client.generate_presigned_url(material.file_path)
    
    return {
        "download_url": download_url,
        "file_name": material.file_name
    }


@router.post("/bookmarks", response_model=MaterialBookmarkResponse)
async def create_bookmark(
    bookmark_data: MaterialBookmarkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyMaterialService(db)
    bookmark = service.bookmark_material(
        bookmark_data,
        current_user.id,
        current_user.institution_id
    )
    return bookmark


@router.put("/bookmarks/{material_id}", response_model=MaterialBookmarkResponse)
async def update_bookmark(
    material_id: int,
    bookmark_data: MaterialBookmarkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyMaterialService(db)
    bookmark = service.update_bookmark(material_id, bookmark_data, current_user.id)
    
    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )
    
    return bookmark


@router.delete("/bookmarks/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bookmark(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyMaterialService(db)
    success = service.remove_bookmark(material_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )


@router.get("/bookmarks/my/list", response_model=List[MaterialBookmarkResponse])
async def get_my_bookmarks(
    favorites_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyMaterialService(db)
    bookmarks = service.get_user_bookmarks(
        current_user.id,
        current_user.institution_id,
        favorites_only
    )
    return bookmarks


@router.post("/share", response_model=MaterialShareResponse)
async def share_material(
    share_data: MaterialShareCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyMaterialService(db)
    share = service.share_material(
        share_data,
        current_user.id,
        current_user.institution_id
    )
    return share


@router.get("/share/{token}", response_model=MaterialShareResponse)
async def get_shared_material(
    token: str,
    db: Session = Depends(get_db)
):
    service = StudyMaterialService(db)
    share = service.get_shared_material(token)
    
    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared material not found or expired"
        )
    
    return share


@router.get("/hierarchy/tree", response_model=List[MaterialHierarchyNode])
async def get_hierarchy(
    grade_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyMaterialService(db)
    hierarchy = service.get_material_hierarchy(current_user.institution_id, grade_id)
    return hierarchy


@router.get("/autocomplete/suggestions", response_model=AutocompleteResponse)
async def get_autocomplete(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyMaterialService(db)
    suggestions = service.get_autocomplete(q, current_user.institution_id)
    return suggestions


@router.get("/stats/overview", response_model=MaterialStatsResponse)
async def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyMaterialService(db)
    stats = service.get_stats(current_user.institution_id, current_user.id)
    return stats


@router.get("/recent/accessed", response_model=List[StudyMaterialResponse])
async def get_recently_accessed(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyMaterialService(db)
    materials = service.get_recently_accessed(
        current_user.id,
        current_user.institution_id,
        limit
    )
    return materials


@router.post("/tags", response_model=MaterialTagResponse)
async def create_tag(
    tag_data: MaterialTagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyMaterialService(db)
    tag = service.create_tag(tag_data, current_user.institution_id)
    return tag


@router.get("/tags/list", response_model=List[MaterialTagResponse])
async def get_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyMaterialService(db)
    tags = service.get_tags(current_user.institution_id)
    return tags
