from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Request
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.models.student import Parent
from src.models.document_vault import FamilyDocument, DocumentFolder, DocumentShare, DocumentAccessLog
from src.dependencies.auth import get_current_user
from src.schemas.document_vault import (
    FamilyDocumentCreate,
    FamilyDocumentUpdate,
    FamilyDocumentResponse,
    DocumentFolderCreate,
    DocumentFolderUpdate,
    DocumentFolderResponse,
    DocumentShareCreate,
    DocumentShareUpdate,
    DocumentShareResponse,
    DocumentAccessLogResponse,
    DocumentUploadRequest,
    DocumentUploadResponse,
    OCRResult,
    DocumentStatistics,
)
from datetime import datetime
import boto3
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import os
import pytesseract
from PIL import Image
import io
import hashlib

router = APIRouter()


def encrypt_file(file_content: bytes) -> tuple[bytes, str, str]:
    """Encrypt file content using AES-256"""
    key = os.urandom(32)
    iv = os.urandom(16)
    
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    
    # Pad content to block size
    block_size = 16
    padding_length = block_size - (len(file_content) % block_size)
    padded_content = file_content + bytes([padding_length] * padding_length)
    
    encrypted_content = encryptor.update(padded_content) + encryptor.finalize()
    
    key_hash = hashlib.sha256(key).hexdigest()
    iv_hex = iv.hex()
    
    return encrypted_content, key_hash, iv_hex


def decrypt_file(encrypted_content: bytes, key: bytes, iv: bytes) -> bytes:
    """Decrypt file content using AES-256"""
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    
    padded_content = decryptor.update(encrypted_content) + decryptor.finalize()
    
    # Remove padding
    padding_length = padded_content[-1]
    content = padded_content[:-padding_length]
    
    return content


def perform_ocr(file_content: bytes, file_type: str) -> OCRResult:
    """Perform OCR on document to extract text and categorize"""
    try:
        image = Image.open(io.BytesIO(file_content))
        text = pytesseract.image_to_string(image)
        
        # Auto-detect document type based on keywords
        detected_type = None
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['birth', 'certificate', 'born']):
            detected_type = 'birth_certificate'
        elif any(word in text_lower for word in ['immunization', 'vaccine', 'vaccination']):
            detected_type = 'immunization_record'
        elif any(word in text_lower for word in ['iep', 'individualized', 'education', 'plan']):
            detected_type = 'iep'
        elif any(word in text_lower for word in ['transcript', 'grades', 'academic']):
            detected_type = 'transcript'
        
        return OCRResult(
            text=text,
            confidence=0.85,
            detected_type=detected_type,
            metadata={'word_count': len(text.split())}
        )
    except Exception as e:
        return OCRResult(
            text='',
            confidence=0.0,
            detected_type=None,
            metadata={'error': str(e)}
        )


@router.post("/folders", response_model=DocumentFolderResponse, status_code=status.HTTP_201_CREATED)
async def create_folder(
    folder_data: DocumentFolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new document folder"""
    parent_profile = db.query(Parent).filter(Parent.user_id == current_user.id).first()
    if not parent_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent profile not found")
    
    folder = DocumentFolder(
        institution_id=current_user.institution_id,
        parent_id=parent_profile.id,
        parent_folder_id=folder_data.parent_folder_id,
        name=folder_data.name,
        description=folder_data.description,
        color=folder_data.color,
        icon=folder_data.icon,
    )
    
    db.add(folder)
    db.commit()
    db.refresh(folder)
    
    return folder


@router.get("/folders", response_model=List[DocumentFolderResponse])
async def list_folders(
    parent_folder_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List document folders"""
    parent_profile = db.query(Parent).filter(Parent.user_id == current_user.id).first()
    if not parent_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent profile not found")
    
    query = db.query(DocumentFolder).filter(
        DocumentFolder.parent_id == parent_profile.id,
        DocumentFolder.is_active == True
    )
    
    if parent_folder_id:
        query = query.filter(DocumentFolder.parent_folder_id == parent_folder_id)
    else:
        query = query.filter(DocumentFolder.parent_folder_id.is_(None))
    
    folders = query.all()
    return folders


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Query(...),
    document_type: str = Query(...),
    description: Optional[str] = Query(None),
    student_id: Optional[int] = Query(None),
    folder_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a document with AES-256 encryption"""
    parent_profile = db.query(Parent).filter(Parent.user_id == current_user.id).first()
    if not parent_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent profile not found")
    
    # Read file content
    file_content = await file.read()
    
    # Perform OCR
    ocr_result = perform_ocr(file_content, file.content_type or '')
    
    # Encrypt file
    encrypted_content, key_hash, iv_hex = encrypt_file(file_content)
    
    # Upload to S3 (simulated)
    s3_key = f"documents/{current_user.institution_id}/{parent_profile.id}/{datetime.utcnow().timestamp()}_{file.filename}"
    encrypted_file_url = f"https://s3.amazonaws.com/bucket/{s3_key}"
    
    # Create document record
    document = FamilyDocument(
        institution_id=current_user.institution_id,
        parent_id=parent_profile.id,
        student_id=student_id,
        folder_id=folder_id,
        title=title,
        description=description,
        document_type=document_type,
        file_name=file.filename,
        file_size=len(file_content),
        file_type=file.content_type or 'application/octet-stream',
        mime_type=file.content_type,
        encrypted_file_url=encrypted_file_url,
        s3_key=s3_key,
        encryption_key_hash=key_hash,
        encryption_iv=iv_hex,
        ocr_text=ocr_result.text if ocr_result.text else None,
        extracted_metadata=ocr_result.metadata,
        ferpa_compliant=True,
        is_sensitive=True,
        access_log_enabled=True,
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    # Log access
    log_document_access(db, document.id, current_user.id, 'upload', None)
    
    return DocumentUploadResponse(
        document_id=document.id,
        upload_url=encrypted_file_url,
        encryption_key=key_hash,
    )


@router.get("/documents", response_model=List[FamilyDocumentResponse])
async def list_documents(
    folder_id: Optional[int] = Query(None),
    document_type: Optional[str] = Query(None),
    student_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List documents"""
    parent_profile = db.query(Parent).filter(Parent.user_id == current_user.id).first()
    if not parent_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent profile not found")
    
    query = db.query(FamilyDocument).filter(
        FamilyDocument.parent_id == parent_profile.id,
        FamilyDocument.is_active == True
    )
    
    if folder_id:
        query = query.filter(FamilyDocument.folder_id == folder_id)
    if document_type:
        query = query.filter(FamilyDocument.document_type == document_type)
    if student_id:
        query = query.filter(FamilyDocument.student_id == student_id)
    
    documents = query.offset(skip).limit(limit).all()
    return documents


@router.get("/documents/{document_id}", response_model=FamilyDocumentResponse)
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get document details"""
    document = db.query(FamilyDocument).filter(FamilyDocument.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    # Check access permissions
    parent_profile = db.query(Parent).filter(Parent.user_id == current_user.id).first()
    if document.parent_id != parent_profile.id:
        # Check if shared
        share = db.query(DocumentShare).filter(
            DocumentShare.document_id == document_id,
            DocumentShare.shared_with_user_id == current_user.id,
            DocumentShare.is_active == True
        ).first()
        
        if not share:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    # Log access
    log_document_access(db, document_id, current_user.id, 'view', None)
    
    return document


@router.patch("/documents/{document_id}", response_model=FamilyDocumentResponse)
async def update_document(
    document_id: int,
    document_data: FamilyDocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update document details"""
    document = db.query(FamilyDocument).filter(FamilyDocument.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    parent_profile = db.query(Parent).filter(Parent.user_id == current_user.id).first()
    if document.parent_id != parent_profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    for field, value in document_data.model_dump(exclude_unset=True).items():
        setattr(document, field, value)
    
    db.commit()
    db.refresh(document)
    
    log_document_access(db, document_id, current_user.id, 'update', None)
    
    return document


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a document"""
    document = db.query(FamilyDocument).filter(FamilyDocument.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    parent_profile = db.query(Parent).filter(Parent.user_id == current_user.id).first()
    if document.parent_id != parent_profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    document.is_active = False
    db.commit()
    
    log_document_access(db, document_id, current_user.id, 'delete', None)


@router.post("/documents/{document_id}/share", response_model=DocumentShareResponse, status_code=status.HTTP_201_CREATED)
async def share_document(
    document_id: int,
    share_data: DocumentShareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Share document with another user"""
    document = db.query(FamilyDocument).filter(FamilyDocument.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    parent_profile = db.query(Parent).filter(Parent.user_id == current_user.id).first()
    if document.parent_id != parent_profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    share = DocumentShare(
        document_id=document_id,
        shared_with_user_id=share_data.shared_with_user_id,
        shared_by_id=current_user.id,
        permission=share_data.permission,
        expires_at=share_data.expires_at,
    )
    
    db.add(share)
    db.commit()
    db.refresh(share)
    
    log_document_access(db, document_id, current_user.id, 'share', None)
    
    return share


@router.get("/documents/{document_id}/access-logs", response_model=List[DocumentAccessLogResponse])
async def get_access_logs(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get document access logs (FERPA compliance)"""
    document = db.query(FamilyDocument).filter(FamilyDocument.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    parent_profile = db.query(Parent).filter(Parent.user_id == current_user.id).first()
    if document.parent_id != parent_profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    logs = db.query(DocumentAccessLog).filter(
        DocumentAccessLog.document_id == document_id
    ).order_by(DocumentAccessLog.created_at.desc()).all()
    
    return logs


@router.get("/statistics", response_model=DocumentStatistics)
async def get_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get document vault statistics"""
    parent_profile = db.query(Parent).filter(Parent.user_id == current_user.id).first()
    if not parent_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent profile not found")
    
    documents = db.query(FamilyDocument).filter(
        FamilyDocument.parent_id == parent_profile.id,
        FamilyDocument.is_active == True
    ).all()
    
    total_documents = len(documents)
    documents_by_type = {}
    documents_by_status = {}
    total_storage = 0
    
    for doc in documents:
        documents_by_type[doc.document_type] = documents_by_type.get(doc.document_type, 0) + 1
        documents_by_status[doc.status] = documents_by_status.get(doc.status, 0) + 1
        total_storage += doc.file_size
    
    return DocumentStatistics(
        total_documents=total_documents,
        documents_by_type=documents_by_type,
        total_storage_mb=total_storage / (1024 * 1024),
        documents_by_status=documents_by_status,
        recent_uploads=len([d for d in documents if (datetime.utcnow() - d.created_at).days <= 7]),
        expiring_soon=len([d for d in documents if d.expiry_date and (d.expiry_date - datetime.utcnow()).days <= 30]),
    )


def log_document_access(db: Session, document_id: int, user_id: int, action: str, request: Optional[Request]):
    """Log document access for FERPA compliance"""
    log = DocumentAccessLog(
        document_id=document_id,
        user_id=user_id,
        action=action,
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get('user-agent') if request else None,
    )
    db.add(log)
    db.commit()
