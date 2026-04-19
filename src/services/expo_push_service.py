from typing import List, Dict, Any, Optional
import logging

try:
    from exponent_server_sdk import (
        DeviceNotRegisteredError,
        PushClient,
        PushMessage,
        PushServerError,
        PushTicketError,
    )
    EXPO_SDK_AVAILABLE = True
except ImportError:
    EXPO_SDK_AVAILABLE = False
    DeviceNotRegisteredError = Exception
    PushServerError = Exception
    PushTicketError = Exception
    PushClient = None
    PushMessage = None

logger = logging.getLogger(__name__)


class ExpoPushService:
    def __init__(self):
        self.client = PushClient() if EXPO_SDK_AVAILABLE else None

    def send_push_notification(
        self,
        tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        priority: str = "default",
        sound: Optional[str] = "default",
        badge: Optional[int] = None,
        channel_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not EXPO_SDK_AVAILABLE:
            return {"success": False, "error": "Expo push SDK not installed"}

        if not tokens:
            return {"success": False, "error": "No tokens provided"}

        messages = []
        for token in tokens:
            try:
                message = PushMessage(
                    to=token,
                    title=title,
                    body=body,
                    data=data or {},
                    priority=priority,
                    sound=sound,
                    badge=badge,
                    channel_id=channel_id,
                )
                messages.append(message)
            except Exception as e:
                logger.error(f"Error creating push message for token {token}: {str(e)}")

        if not messages:
            return {"success": False, "error": "Failed to create push messages"}

        try:
            tickets = self.client.publish_multiple(messages)
            
            success_count = 0
            error_count = 0
            invalid_tokens = []
            errors = []

            for ticket, token in zip(tickets, tokens):
                try:
                    ticket.validate_response()
                    success_count += 1
                except DeviceNotRegisteredError:
                    logger.warning(f"Device not registered: {token}")
                    invalid_tokens.append(token)
                    error_count += 1
                except PushTicketError as e:
                    logger.error(f"Push ticket error for {token}: {str(e)}")
                    errors.append({"token": token, "error": str(e)})
                    error_count += 1

            return {
                "success": success_count > 0,
                "success_count": success_count,
                "error_count": error_count,
                "invalid_tokens": invalid_tokens,
                "errors": errors,
            }

        except PushServerError as e:
            logger.error(f"Expo push server error: {str(e)}")
            return {
                "success": False,
                "error": f"Push server error: {str(e)}",
            }
        except Exception as e:
            logger.error(f"Unexpected error sending push notification: {str(e)}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
            }

    def send_single_push_notification(
        self,
        token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        priority: str = "default",
        sound: Optional[str] = "default",
        badge: Optional[int] = None,
        channel_id: Optional[str] = None,
    ) -> bool:
        result = self.send_push_notification(
            tokens=[token],
            title=title,
            body=body,
            data=data,
            priority=priority,
            sound=sound,
            badge=badge,
            channel_id=channel_id,
        )
        return result.get("success", False)

    def validate_token(self, token: str) -> bool:
        if not EXPO_SDK_AVAILABLE:
            return False
        return PushClient.is_exponent_push_token(token)

    def send_notification_with_deep_link(
        self,
        tokens: List[str],
        title: str,
        body: str,
        screen: str,
        params: Optional[Dict[str, Any]] = None,
        notification_type: Optional[str] = None,
        priority: str = "default",
        channel_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        data = {
            "screen": screen,
            "params": params or {},
        }
        
        if notification_type:
            data["type"] = notification_type

        return self.send_push_notification(
            tokens=tokens,
            title=title,
            body=body,
            data=data,
            priority=priority,
            channel_id=channel_id,
        )
