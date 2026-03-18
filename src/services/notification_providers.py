from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging
from datetime import datetime

try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail
    SENDGRID_AVAILABLE = True
except ImportError:
    SENDGRID_AVAILABLE = False

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

from src.config import settings

logger = logging.getLogger(__name__)


class NotificationProvider(ABC):
    @abstractmethod
    async def send(self, recipient: str, subject: str, content: str, data: Optional[Dict[str, Any]] = None) -> bool:
        pass


class EmailProvider(NotificationProvider):
    def __init__(self, api_key: str, sender_email: str, sender_name: str):
        self.api_key = api_key
        self.sender_email = sender_email
        self.sender_name = sender_name

    async def send(self, recipient: str, subject: str, content: str, data: Optional[Dict[str, Any]] = None) -> bool:
        if not SENDGRID_AVAILABLE:
            logger.error("SendGrid library not installed")
            return False
        
        try:
            message = Mail(
                from_email=(self.sender_email, self.sender_name),
                to_emails=recipient,
                subject=subject,
                html_content=content
            )
            
            sg = SendGridAPIClient(self.api_key)
            response = sg.send(message)
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"Email sent successfully to {recipient}")
                return True
            else:
                logger.error(f"Failed to send email. Status code: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return False


class SMSProvider(NotificationProvider):
    def __init__(self, auth_key: str, sender_id: str, route: str = "4"):
        self.auth_key = auth_key
        self.sender_id = sender_id
        self.route = route
        self.base_url = "https://api.msg91.com/api/v5"

    async def send(self, recipient: str, subject: str, content: str, data: Optional[Dict[str, Any]] = None) -> bool:
        if not REQUESTS_AVAILABLE:
            logger.error("Requests library not installed")
            return False
        
        try:
            url = f"{self.base_url}/flow/"
            
            payload = {
                "flow_id": data.get("template_id") if data else None,
                "sender": self.sender_id,
                "mobiles": recipient,
                "message": content,
            }
            
            headers = {
                "authkey": self.auth_key,
                "content-type": "application/json"
            }
            
            response = requests.post(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                logger.info(f"SMS sent successfully to {recipient}")
                return True
            else:
                logger.error(f"Failed to send SMS. Status code: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending SMS: {str(e)}")
            return False


class PushProvider(NotificationProvider):
    def __init__(self, server_key: str):
        self.server_key = server_key
        self.fcm_url = "https://fcm.googleapis.com/fcm/send"

    async def send(self, recipient: str, subject: str, content: str, data: Optional[Dict[str, Any]] = None) -> bool:
        if not REQUESTS_AVAILABLE:
            logger.error("Requests library not installed")
            return False
        
        try:
            headers = {
                "Authorization": f"key={self.server_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "to": recipient,
                "notification": {
                    "title": subject,
                    "body": content,
                    "click_action": "FLUTTER_NOTIFICATION_CLICK",
                    "sound": "default"
                },
                "data": data or {}
            }
            
            response = requests.post(self.fcm_url, json=payload, headers=headers)
            
            if response.status_code == 200:
                logger.info(f"Push notification sent successfully to {recipient}")
                return True
            else:
                logger.error(f"Failed to send push notification. Status code: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending push notification: {str(e)}")
            return False


class ExpoPushProvider(NotificationProvider):
    def __init__(self):
        self.expo_url = "https://exp.host/--/api/v2/push/send"

    async def send(self, recipient: str, subject: str, content: str, data: Optional[Dict[str, Any]] = None) -> bool:
        if not REQUESTS_AVAILABLE:
            logger.error("Requests library not installed")
            return False
        
        try:
            headers = {
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/json"
            }
            
            payload = {
                "to": recipient,
                "title": subject,
                "body": content,
                "sound": "default",
                "priority": "high"
            }
            
            if data:
                payload["data"] = data
            
            response = requests.post(self.expo_url, json=payload, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("data", {}).get("status") == "ok":
                    logger.info(f"Expo push notification sent successfully to {recipient}")
                    return True
                else:
                    logger.error(f"Expo push notification failed: {result.get('data', {}).get('message', 'Unknown error')}")
                    return False
            else:
                logger.error(f"Failed to send Expo push notification. Status code: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending Expo push notification: {str(e)}")
            return False

    async def send_bulk(self, messages: list) -> Dict[str, Any]:
        if not REQUESTS_AVAILABLE:
            logger.error("Requests library not installed")
            return {"success": False, "error": "Requests library not available"}
        
        try:
            headers = {
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/json"
            }
            
            response = requests.post(self.expo_url, json=messages, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                return {"success": True, "data": result.get("data", [])}
            else:
                logger.error(f"Failed to send bulk Expo push notifications. Status code: {response.status_code}")
                return {"success": False, "error": f"Status code: {response.status_code}"}
                
        except Exception as e:
            logger.error(f"Error sending bulk Expo push notifications: {str(e)}")
            return {"success": False, "error": str(e)}


class InAppProvider(NotificationProvider):
    async def send(self, recipient: str, subject: str, content: str, data: Optional[Dict[str, Any]] = None) -> bool:
        return True


class NotificationProviderFactory:
    _providers: Dict[str, NotificationProvider] = {}

    @classmethod
    def get_provider(cls, channel: str) -> NotificationProvider:
        if channel not in cls._providers:
            cls._providers[channel] = cls._create_provider(channel)
        return cls._providers[channel]

    @classmethod
    def _create_provider(cls, channel: str) -> NotificationProvider:
        if channel == "email":
            return EmailProvider(
                api_key=getattr(settings, 'sendgrid_api_key', ''),
                sender_email=getattr(settings, 'sender_email', 'noreply@example.com'),
                sender_name=getattr(settings, 'sender_name', 'System')
            )
        elif channel == "sms":
            return SMSProvider(
                auth_key=getattr(settings, 'msg91_auth_key', ''),
                sender_id=getattr(settings, 'msg91_sender_id', 'SENDER')
            )
        elif channel == "push":
            use_expo = getattr(settings, 'use_expo_push', True)
            if use_expo:
                return ExpoPushProvider()
            else:
                return PushProvider(
                    server_key=getattr(settings, 'fcm_server_key', '')
                )
        elif channel == "in_app":
            return InAppProvider()
        else:
            raise ValueError(f"Unknown notification channel: {channel}")
    
    @classmethod
    def get_expo_provider(cls) -> ExpoPushProvider:
        return ExpoPushProvider()
