from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from passlib.context import CryptContext

from src.database import get_db
from src.models.user import User
from src.models.user_settings import UserSettings, UserDevice
from src.models.mobile_auth import MobileAuthEvent, BiometricSession, SensitiveOperationLog, PinAttempt
from src.dependencies.auth import get_current_user
from src.schemas.mobile_auth import (
    BiometricSetupRequest,
    BiometricSetupResponse,
    DeviceRegistrationRequest,
    DeviceRegistrationResponse,
    SecuritySettingsRequest,
    SecuritySettingsResponse,
    PinSetupRequest,
    PinVerifyRequest,
    SensitiveOperationRequest,
    DeviceListResponse,
    AuthEventResponse,
    MessageResponse,
)

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/biometric/setup", response_model=BiometricSetupResponse)
async def setup_biometric(
    request: BiometricSetupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    settings = db.query(UserSettings).filter(
        UserSettings.user_id == current_user.id
    ).first()

    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)

    settings.biometric_enabled = request.enabled
    db.commit()

    device = db.query(UserDevice).filter(
        UserDevice.id == request.device_id,
        UserDevice.user_id == current_user.id
    ).first()

    if device:
        device.biometric_enabled = request.enabled
        device.biometric_type = request.biometric_type if request.enabled else None
        db.commit()

    event = MobileAuthEvent(
        user_id=current_user.id,
        device_id=request.device_id,
        event_type="biometric_setup",
        auth_method=request.biometric_type,
        success=True,
        device_fingerprint=request.device_fingerprint,
        metadata={"enabled": request.enabled}
    )
    db.add(event)
    db.commit()

    return {
        "success": True,
        "enabled": request.enabled,
        "biometric_type": request.biometric_type if request.enabled else None,
        "message": f"Biometric authentication {'enabled' if request.enabled else 'disabled'} successfully"
    }


@router.post("/device/register", response_model=DeviceRegistrationResponse)
async def register_device(
    request: DeviceRegistrationRequest,
    http_request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    existing_device = db.query(UserDevice).filter(
        UserDevice.user_id == current_user.id,
        UserDevice.device_fingerprint == request.device_fingerprint
    ).first()

    if existing_device:
        existing_device.last_active = datetime.utcnow()
        existing_device.device_name = request.device_name
        existing_device.device_model = request.device_model
        existing_device.os_version = request.os_version
        existing_device.app_version = request.app_version
        db.commit()

        return {
            "device_id": existing_device.id,
            "is_new": False,
            "is_trusted": existing_device.is_trusted,
            "message": "Device updated successfully"
        }

    client_ip = http_request.client.host if http_request.client else "unknown"

    new_device = UserDevice(
        user_id=current_user.id,
        device_name=request.device_name,
        device_type=request.device_type,
        device_fingerprint=request.device_fingerprint,
        device_model=request.device_model,
        os_version=request.os_version,
        app_version=request.app_version,
        ip_address=client_ip,
        is_trusted=False,
    )
    db.add(new_device)
    db.commit()
    db.refresh(new_device)

    event = MobileAuthEvent(
        user_id=current_user.id,
        device_id=new_device.id,
        event_type="device_registration",
        auth_method="device_fingerprint",
        success=True,
        device_fingerprint=request.device_fingerprint,
        ip_address=client_ip,
        device_info={
            "device_name": request.device_name,
            "device_type": request.device_type,
            "device_model": request.device_model,
            "os_version": request.os_version,
            "app_version": request.app_version,
        }
    )
    db.add(event)
    db.commit()

    return {
        "device_id": new_device.id,
        "is_new": True,
        "is_trusted": False,
        "message": "New device registered successfully"
    }


@router.post("/pin/setup", response_model=MessageResponse)
async def setup_pin(
    request: PinSetupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    settings = db.query(UserSettings).filter(
        UserSettings.user_id == current_user.id
    ).first()

    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)

    pin_hash = pwd_context.hash(request.pin)
    settings.pin_enabled = request.enabled
    settings.pin_hash = pin_hash if request.enabled else None
    db.commit()

    event = MobileAuthEvent(
        user_id=current_user.id,
        device_id=request.device_id,
        event_type="pin_setup",
        auth_method="pin",
        success=True,
        device_fingerprint=request.device_fingerprint,
        metadata={"enabled": request.enabled}
    )
    db.add(event)
    db.commit()

    return {
        "message": f"PIN {'enabled' if request.enabled else 'disabled'} successfully"
    }


@router.post("/pin/verify", response_model=MessageResponse)
async def verify_pin(
    request: PinVerifyRequest,
    http_request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    settings = db.query(UserSettings).filter(
        UserSettings.user_id == current_user.id
    ).first()

    if not settings or not settings.pin_enabled or not settings.pin_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN not set up"
        )

    recent_attempts = db.query(PinAttempt).filter(
        PinAttempt.user_id == current_user.id,
        PinAttempt.locked_until.isnot(None),
        PinAttempt.locked_until > datetime.utcnow()
    ).first()

    if recent_attempts:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed attempts. Try again later."
        )

    verified = pwd_context.verify(request.pin, settings.pin_hash)
    client_ip = http_request.client.host if http_request.client else "unknown"

    if not verified:
        failed_attempts = db.query(PinAttempt).filter(
            PinAttempt.user_id == current_user.id,
            PinAttempt.success == False,
            PinAttempt.created_at > datetime.utcnow() - timedelta(minutes=15)
        ).count()

        locked_until = None
        if failed_attempts >= 4:
            locked_until = datetime.utcnow() + timedelta(minutes=30)

        pin_attempt = PinAttempt(
            user_id=current_user.id,
            device_id=request.device_id,
            success=False,
            attempt_count=failed_attempts + 1,
            locked_until=locked_until,
            ip_address=client_ip
        )
        db.add(pin_attempt)
        db.commit()

        event = MobileAuthEvent(
            user_id=current_user.id,
            device_id=request.device_id,
            event_type="pin_verification",
            auth_method="pin",
            success=False,
            failure_reason="Invalid PIN",
            ip_address=client_ip,
        )
        db.add(event)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid PIN"
        )

    pin_attempt = PinAttempt(
        user_id=current_user.id,
        device_id=request.device_id,
        success=True,
        attempt_count=1,
        ip_address=client_ip
    )
    db.add(pin_attempt)

    event = MobileAuthEvent(
        user_id=current_user.id,
        device_id=request.device_id,
        event_type="pin_verification",
        auth_method="pin",
        success=True,
        ip_address=client_ip,
    )
    db.add(event)
    db.commit()

    return {"message": "PIN verified successfully"}


@router.post("/sensitive-operation/verify", response_model=MessageResponse)
async def verify_sensitive_operation(
    request: SensitiveOperationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    log_entry = SensitiveOperationLog(
        user_id=current_user.id,
        device_id=request.device_id,
        operation_type=request.operation_type,
        operation_details=request.operation_details,
        required_reauth=True,
        reauth_method=request.auth_method,
        reauth_success=request.auth_success,
        metadata=request.metadata
    )
    db.add(log_entry)

    event = MobileAuthEvent(
        user_id=current_user.id,
        device_id=request.device_id,
        event_type="sensitive_operation",
        auth_method=request.auth_method,
        success=request.auth_success,
        metadata={
            "operation_type": request.operation_type,
            "operation_details": request.operation_details
        }
    )
    db.add(event)
    db.commit()

    return {"message": "Sensitive operation logged successfully"}


@router.put("/security-settings", response_model=SecuritySettingsResponse)
async def update_security_settings(
    request: SecuritySettingsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    settings = db.query(UserSettings).filter(
        UserSettings.user_id == current_user.id
    ).first()

    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)

    if request.session_timeout_minutes is not None:
        settings.session_timeout_minutes = request.session_timeout_minutes
    if request.auto_lock_minutes is not None:
        settings.auto_lock_minutes = request.auto_lock_minutes
    if request.require_biometric_for_sensitive is not None:
        settings.require_biometric_for_sensitive = request.require_biometric_for_sensitive

    db.commit()
    db.refresh(settings)

    return {
        "biometric_enabled": settings.biometric_enabled,
        "pin_enabled": settings.pin_enabled,
        "session_timeout_minutes": settings.session_timeout_minutes,
        "auto_lock_minutes": settings.auto_lock_minutes,
        "require_biometric_for_sensitive": settings.require_biometric_for_sensitive,
    }


@router.get("/security-settings", response_model=SecuritySettingsResponse)
async def get_security_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    settings = db.query(UserSettings).filter(
        UserSettings.user_id == current_user.id
    ).first()

    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return {
        "biometric_enabled": settings.biometric_enabled,
        "pin_enabled": settings.pin_enabled,
        "session_timeout_minutes": settings.session_timeout_minutes,
        "auto_lock_minutes": settings.auto_lock_minutes,
        "require_biometric_for_sensitive": settings.require_biometric_for_sensitive,
    }


@router.get("/devices", response_model=List[DeviceListResponse])
async def get_user_devices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[dict]:
    devices = db.query(UserDevice).filter(
        UserDevice.user_id == current_user.id
    ).order_by(desc(UserDevice.last_active)).all()

    return [
        {
            "id": device.id,
            "device_name": device.device_name,
            "device_type": device.device_type,
            "device_model": device.device_model,
            "os_version": device.os_version,
            "last_active": device.last_active,
            "is_current": device.is_current,
            "is_trusted": device.is_trusted,
            "biometric_enabled": device.biometric_enabled,
            "biometric_type": device.biometric_type,
            "created_at": device.created_at,
        }
        for device in devices
    ]


@router.delete("/devices/{device_id}", response_model=MessageResponse)
async def remove_device(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    device = db.query(UserDevice).filter(
        UserDevice.id == device_id,
        UserDevice.user_id == current_user.id
    ).first()

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )

    db.delete(device)
    db.commit()

    return {"message": "Device removed successfully"}


@router.post("/devices/{device_id}/trust", response_model=MessageResponse)
async def trust_device(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    device = db.query(UserDevice).filter(
        UserDevice.id == device_id,
        UserDevice.user_id == current_user.id
    ).first()

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )

    device.is_trusted = True
    db.commit()

    event = MobileAuthEvent(
        user_id=current_user.id,
        device_id=device_id,
        event_type="device_trusted",
        auth_method="manual",
        success=True,
    )
    db.add(event)
    db.commit()

    return {"message": "Device marked as trusted"}


@router.get("/auth-events", response_model=List[AuthEventResponse])
async def get_auth_events(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[dict]:
    events = db.query(MobileAuthEvent).filter(
        MobileAuthEvent.user_id == current_user.id
    ).order_by(desc(MobileAuthEvent.created_at)).limit(limit).all()

    return [
        {
            "id": event.id,
            "event_type": event.event_type,
            "auth_method": event.auth_method,
            "success": event.success,
            "failure_reason": event.failure_reason,
            "device_fingerprint": event.device_fingerprint,
            "ip_address": event.ip_address,
            "location": event.location,
            "created_at": event.created_at,
        }
        for event in events
    ]
