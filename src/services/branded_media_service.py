from typing import Optional, Dict, Any, BinaryIO
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
import io
import json
from datetime import datetime
from pydub import AudioSegment
import base64

from src.models.branding import InstitutionBranding
from src.utils.s3_client import s3_client


class BrandedMediaService:
    """Service for managing branded media files (sounds, animations, etc.)."""
    
    MAX_SOUND_DURATION_MS = 5000  # 5 seconds
    ALLOWED_SOUND_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav"]
    ALLOWED_ANIMATION_TYPES = ["application/json", "image/gif", "video/mp4", "video/webm"]
    MAX_SOUND_SIZE = 5 * 1024 * 1024  # 5MB
    MAX_ANIMATION_SIZE = 10 * 1024 * 1024  # 10MB
    
    NOTIFICATION_TYPES = [
        "message",
        "assignment",
        "grade",
        "announcement",
        "reminder",
        "achievement",
        "doubt_answered",
        "meeting"
    ]
    
    @staticmethod
    async def upload_notification_sound(
        db: Session,
        institution_id: int,
        notification_type: str,
        file: UploadFile
    ) -> Dict[str, Any]:
        """
        Upload a notification sound for a specific notification type.
        Validates duration, generates waveform preview.
        """
        branding = db.query(InstitutionBranding).filter(
            InstitutionBranding.institution_id == institution_id
        ).first()
        
        if not branding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Institution branding not found"
            )
        
        # Validate notification type
        if notification_type not in BrandedMediaService.NOTIFICATION_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid notification type. Must be one of: {', '.join(BrandedMediaService.NOTIFICATION_TYPES)}"
            )
        
        # Validate file type
        if file.content_type not in BrandedMediaService.ALLOWED_SOUND_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed types: MP3, WAV"
            )
        
        # Read file
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > BrandedMediaService.MAX_SOUND_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size must be less than 5MB"
            )
        
        file_content = await file.read()
        file.file.seek(0)
        
        # Validate duration using pydub
        try:
            audio = AudioSegment.from_file(io.BytesIO(file_content))
            duration_ms = len(audio)
            
            if duration_ms > BrandedMediaService.MAX_SOUND_DURATION_MS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Audio duration must be 5 seconds or less. Current: {duration_ms/1000:.2f}s"
                )
            
            # Generate waveform data (simplified)
            waveform_data = BrandedMediaService._generate_waveform(audio)
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid audio file: {str(e)}"
            )
        
        # Delete old sound if exists
        current_sounds = branding.branded_notification_sounds or {}
        if notification_type in current_sounds:
            old_s3_key = current_sounds[notification_type].get("s3_key")
            if old_s3_key:
                try:
                    s3_client.delete_file(old_s3_key)
                except Exception:
                    pass
        
        # Upload to S3
        try:
            folder = f"branding/{institution_id}/sounds"
            file_url, s3_key = s3_client.upload_file(
                io.BytesIO(file_content),
                f"{notification_type}_{file.filename}",
                folder=folder,
                content_type=file.content_type
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file: {str(e)}"
            )
        
        # Update branding
        if not branding.branded_notification_sounds:
            branding.branded_notification_sounds = {}
        
        branding.branded_notification_sounds[notification_type] = {
            "url": file_url,
            "s3_key": s3_key,
            "duration_ms": duration_ms,
            "waveform": waveform_data,
            "uploaded_at": datetime.utcnow().isoformat()
        }
        
        # Force SQLAlchemy to detect JSON change
        branding.branded_notification_sounds = dict(branding.branded_notification_sounds)
        branding.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(branding)
        
        return {
            "notification_type": notification_type,
            "url": file_url,
            "duration_ms": duration_ms,
            "waveform": waveform_data
        }
    
    @staticmethod
    async def upload_loading_animation(
        db: Session,
        institution_id: int,
        file: UploadFile,
        animation_type: str
    ) -> Dict[str, Any]:
        """
        Upload loading screen animation (Lottie JSON, GIF, or video).
        """
        branding = db.query(InstitutionBranding).filter(
            InstitutionBranding.institution_id == institution_id
        ).first()
        
        if not branding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Institution branding not found"
            )
        
        # Validate file type
        if file.content_type not in BrandedMediaService.ALLOWED_ANIMATION_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Allowed types: Lottie JSON, GIF, MP4, WebM"
            )
        
        # Validate file size
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > BrandedMediaService.MAX_ANIMATION_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size must be less than 10MB"
            )
        
        # Validate Lottie JSON if applicable
        if file.content_type == "application/json":
            try:
                content = await file.read()
                json.loads(content)
                file.file.seek(0)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid JSON file"
                )
        
        # Delete old animation if exists
        if branding.loading_screen_animation_s3_key:
            try:
                s3_client.delete_file(branding.loading_screen_animation_s3_key)
            except Exception:
                pass
        
        # Upload to S3
        try:
            folder = f"branding/{institution_id}/animations"
            file_url, s3_key = s3_client.upload_file(
                file.file,
                file.filename,
                folder=folder,
                content_type=file.content_type
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file: {str(e)}"
            )
        
        # Update branding
        branding.loading_screen_animation_url = file_url
        branding.loading_screen_animation_s3_key = s3_key
        branding.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(branding)
        
        return {
            "url": file_url,
            "type": animation_type,
            "size": file_size
        }
    
    @staticmethod
    def update_splash_screen_config(
        db: Session,
        institution_id: int,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update splash screen configuration.
        """
        branding = db.query(InstitutionBranding).filter(
            InstitutionBranding.institution_id == institution_id
        ).first()
        
        if not branding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Institution branding not found"
            )
        
        # Validate config structure
        allowed_keys = [
            "background_color",
            "logo_url",
            "tagline",
            "duration_ms",
            "fade_animation",
            "show_progress_bar"
        ]
        
        for key in config.keys():
            if key not in allowed_keys:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid config key: {key}"
                )
        
        branding.splash_screen_config = config
        branding.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(branding)
        
        return config
    
    @staticmethod
    def delete_notification_sound(
        db: Session,
        institution_id: int,
        notification_type: str
    ) -> bool:
        """
        Delete a notification sound.
        """
        branding = db.query(InstitutionBranding).filter(
            InstitutionBranding.institution_id == institution_id
        ).first()
        
        if not branding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Institution branding not found"
            )
        
        if not branding.branded_notification_sounds:
            return False
        
        if notification_type not in branding.branded_notification_sounds:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification sound not found"
            )
        
        # Delete from S3
        s3_key = branding.branded_notification_sounds[notification_type].get("s3_key")
        if s3_key:
            try:
                s3_client.delete_file(s3_key)
            except Exception:
                pass
        
        # Remove from config
        del branding.branded_notification_sounds[notification_type]
        branding.branded_notification_sounds = dict(branding.branded_notification_sounds)
        branding.updated_at = datetime.utcnow()
        
        db.commit()
        
        return True
    
    @staticmethod
    def _generate_waveform(audio: AudioSegment, num_samples: int = 100) -> list:
        """
        Generate simplified waveform data for visualization.
        """
        samples = audio.get_array_of_samples()
        chunk_size = max(1, len(samples) // num_samples)
        
        waveform = []
        for i in range(0, len(samples), chunk_size):
            chunk = samples[i:i + chunk_size]
            if chunk:
                avg = sum(abs(s) for s in chunk) / len(chunk)
                normalized = min(1.0, avg / 32768)  # Normalize to 0-1
                waveform.append(round(normalized, 3))
        
        return waveform[:num_samples]


branded_media_service = BrandedMediaService()
