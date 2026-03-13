import time
import hmac
import hashlib
import base64
import struct
import json
import requests
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from src.config import settings


class AgoraService:
    def __init__(self):
        self.app_id = settings.agora_app_id
        self.app_certificate = settings.agora_app_certificate
        self.customer_id = settings.agora_customer_id
        self.customer_secret = settings.agora_customer_secret
        self.recording_bucket = settings.agora_recording_bucket
        self.recording_region = settings.agora_recording_region

    def generate_rtc_token(
        self,
        channel_name: str,
        uid: int,
        role: int = 1,
        privilege_expired_ts: int = 0
    ) -> str:
        if not privilege_expired_ts:
            privilege_expired_ts = int(time.time()) + 3600

        return self._build_token_with_uid(
            self.app_id,
            self.app_certificate,
            channel_name,
            uid,
            role,
            privilege_expired_ts
        )

    def _build_token_with_uid(
        self,
        app_id: str,
        app_certificate: str,
        channel_name: str,
        uid: int,
        role: int,
        privilege_expired_ts: int
    ) -> str:
        """Build Agora RTC token with UID"""
        version = "007"
        uid_str = str(uid)
        
        message = self._pack_message(
            app_id,
            app_certificate,
            channel_name,
            uid_str,
            privilege_expired_ts
        )
        
        signature = hmac.new(
            app_certificate.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).digest()
        
        signature_hex = signature.hex()
        content = f"{version}{app_id}{signature_hex}{message}"
        token = base64.b64encode(content.encode('utf-8')).decode('utf-8')
        
        return token

    def _pack_message(
        self,
        app_id: str,
        app_certificate: str,
        channel_name: str,
        uid_str: str,
        privilege_expired_ts: int
    ) -> str:
        """Pack message for token generation"""
        raw_message = f"{app_id}{uid_str}{channel_name}{privilege_expired_ts}"
        return raw_message

    async def acquire_recording_resource(
        self,
        channel_name: str,
        uid: str
    ) -> Dict[str, Any]:
        """Acquire cloud recording resource"""
        url = f"https://api.agora.io/v1/apps/{self.app_id}/cloud_recording/acquire"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": self._get_basic_auth()
        }
        
        payload = {
            "cname": channel_name,
            "uid": uid,
            "clientRequest": {
                "resourceExpiredHour": 24,
                "scene": 0
            }
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        return response.json()

    async def start_recording(
        self,
        channel_name: str,
        uid: str,
        resource_id: str,
        token: str
    ) -> Dict[str, Any]:
        """Start cloud recording"""
        url = f"https://api.agora.io/v1/apps/{self.app_id}/cloud_recording/resourceid/{resource_id}/mode/mix/start"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": self._get_basic_auth()
        }
        
        storage_config = {
            "vendor": 1,
            "region": self._get_region_code(self.recording_region),
            "bucket": self.recording_bucket,
            "accessKey": settings.aws_access_key_id,
            "secretKey": settings.aws_secret_access_key,
            "fileNamePrefix": [f"recordings/{channel_name}"]
        }
        
        payload = {
            "cname": channel_name,
            "uid": uid,
            "clientRequest": {
                "token": token,
                "recordingConfig": {
                    "maxIdleTime": 30,
                    "streamTypes": 2,
                    "channelType": 0,
                    "videoStreamType": 0,
                    "transcodingConfig": {
                        "height": 720,
                        "width": 1280,
                        "bitrate": 2260,
                        "fps": 30,
                        "mixedVideoLayout": 1,
                        "backgroundColor": "#000000"
                    }
                },
                "storageConfig": storage_config
            }
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        return response.json()

    async def stop_recording(
        self,
        channel_name: str,
        uid: str,
        resource_id: str,
        sid: str
    ) -> Dict[str, Any]:
        """Stop cloud recording"""
        url = f"https://api.agora.io/v1/apps/{self.app_id}/cloud_recording/resourceid/{resource_id}/sid/{sid}/mode/mix/stop"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": self._get_basic_auth()
        }
        
        payload = {
            "cname": channel_name,
            "uid": uid,
            "clientRequest": {}
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        return response.json()

    async def query_recording(
        self,
        resource_id: str,
        sid: str
    ) -> Dict[str, Any]:
        """Query recording status"""
        url = f"https://api.agora.io/v1/apps/{self.app_id}/cloud_recording/resourceid/{resource_id}/sid/{sid}/mode/mix/query"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": self._get_basic_auth()
        }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        return response.json()

    def _get_basic_auth(self) -> str:
        """Get basic authentication header"""
        credentials = f"{self.customer_id}:{self.customer_secret}"
        encoded = base64.b64encode(credentials.encode('utf-8')).decode('utf-8')
        return f"Basic {encoded}"

    def _get_region_code(self, region: str) -> int:
        """Get region code for Agora"""
        region_map = {
            "us-east-1": 0,
            "us-east-2": 0,
            "us-west-1": 0,
            "us-west-2": 0,
            "eu-west-1": 1,
            "eu-central-1": 1,
            "ap-southeast-1": 2,
            "ap-southeast-2": 2,
            "ap-northeast-1": 2,
            "cn-north-1": 3,
            "cn-east-1": 3
        }
        return region_map.get(region, 0)

    async def get_channel_users(
        self,
        channel_name: str
    ) -> Dict[str, Any]:
        """Get list of users in a channel"""
        url = f"https://api.agora.io/dev/v1/channel/user/{self.app_id}/{channel_name}"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": self._get_basic_auth()
        }
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        
        return {"success": False, "data": {"channel_exist": False}}

    async def ban_user(
        self,
        channel_name: str,
        uid: int,
        time_in_seconds: int = 3600
    ) -> Dict[str, Any]:
        """Ban a user from channel"""
        url = f"https://api.agora.io/dev/v1/kicking-rule"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": self._get_basic_auth()
        }
        
        payload = {
            "appid": self.app_id,
            "cname": channel_name,
            "uid": uid,
            "time": time_in_seconds
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        return response.json()


def get_agora_service() -> AgoraService:
    return AgoraService()
