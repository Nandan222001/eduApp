"""
Mock implementations for external services used in tests.
"""
from unittest.mock import MagicMock, AsyncMock, patch
from typing import Dict, Any, Optional
import boto3
from moto import mock_aws
import pytest


class MockSendGridClient:
    """Mock SendGrid client for email testing"""
    
    def __init__(self):
        self.sent_emails = []
        self.status_code = 202
    
    def send(self, message):
        """Mock send email"""
        self.sent_emails.append({
            'to': message.to,
            'from': message.from_email,
            'subject': message.subject,
            'content': message.content
        })
        response = MagicMock()
        response.status_code = self.status_code
        return response
    
    def reset(self):
        """Reset sent emails"""
        self.sent_emails = []


class MockRazorpayClient:
    """Mock Razorpay client for payment testing"""
    
    def __init__(self):
        self.orders = []
        self.payments = []
        self.order_counter = 1
        self.payment_counter = 1
    
    @property
    def order(self):
        """Mock order API"""
        return self
    
    @property
    def payment(self):
        """Mock payment API"""
        return self
    
    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Mock create order"""
        order = {
            'id': f'order_test{self.order_counter:06d}',
            'amount': data['amount'],
            'currency': data.get('currency', 'INR'),
            'status': 'created',
            'receipt': data.get('receipt', ''),
            'notes': data.get('notes', {})
        }
        self.orders.append(order)
        self.order_counter += 1
        return order
    
    def fetch(self, payment_id: str) -> Dict[str, Any]:
        """Mock fetch payment"""
        for payment in self.payments:
            if payment['id'] == payment_id:
                return payment
        
        return {
            'id': payment_id,
            'order_id': f'order_test{self.order_counter:06d}',
            'status': 'captured',
            'amount': 99900,
            'currency': 'INR'
        }
    
    def capture(self, payment_id: str, amount: int) -> Dict[str, Any]:
        """Mock capture payment"""
        payment = {
            'id': payment_id,
            'order_id': f'order_test{self.order_counter:06d}',
            'status': 'captured',
            'amount': amount,
            'currency': 'INR'
        }
        self.payments.append(payment)
        return payment
    
    def reset(self):
        """Reset orders and payments"""
        self.orders = []
        self.payments = []
        self.order_counter = 1
        self.payment_counter = 1


class MockS3Client:
    """Mock S3 client for file storage testing"""
    
    def __init__(self):
        self.buckets = {}
        self.uploaded_files = []
    
    def create_bucket(self, Bucket: str, **kwargs):
        """Mock create bucket"""
        self.buckets[Bucket] = {}
    
    def upload_fileobj(self, fileobj, bucket: str, key: str, **kwargs):
        """Mock upload file object"""
        self.uploaded_files.append({
            'bucket': bucket,
            'key': key,
            'size': fileobj.tell() if hasattr(fileobj, 'tell') else 0
        })
        if bucket not in self.buckets:
            self.buckets[bucket] = {}
        self.buckets[bucket][key] = fileobj
    
    def upload_file(self, filename: str, bucket: str, key: str, **kwargs):
        """Mock upload file"""
        self.uploaded_files.append({
            'bucket': bucket,
            'key': key,
            'filename': filename
        })
        if bucket not in self.buckets:
            self.buckets[bucket] = {}
        self.buckets[bucket][key] = filename
    
    def download_fileobj(self, bucket: str, key: str, fileobj):
        """Mock download file object"""
        if bucket in self.buckets and key in self.buckets[bucket]:
            return self.buckets[bucket][key]
        raise Exception(f"Key {key} not found in bucket {bucket}")
    
    def delete_object(self, Bucket: str, Key: str):
        """Mock delete object"""
        if Bucket in self.buckets and Key in self.buckets[Bucket]:
            del self.buckets[Bucket][Key]
    
    def list_objects_v2(self, Bucket: str, Prefix: str = '', **kwargs):
        """Mock list objects"""
        if Bucket not in self.buckets:
            return {'Contents': []}
        
        objects = []
        for key in self.buckets[Bucket].keys():
            if key.startswith(Prefix):
                objects.append({
                    'Key': key,
                    'Size': 1024
                })
        
        return {'Contents': objects}
    
    def generate_presigned_url(self, ClientMethod: str, Params: Dict[str, Any], 
                               ExpiresIn: int = 3600) -> str:
        """Mock generate presigned URL"""
        bucket = Params.get('Bucket', 'test-bucket')
        key = Params.get('Key', 'test-key')
        return f"https://s3.amazonaws.com/{bucket}/{key}?expires={ExpiresIn}"
    
    def reset(self):
        """Reset buckets and uploaded files"""
        self.buckets = {}
        self.uploaded_files = []


class MockRedisClient:
    """Mock Redis client for caching testing"""
    
    def __init__(self):
        self.data = {}
        self.expire_times = {}
    
    async def get(self, key: str) -> Optional[str]:
        """Mock get"""
        return self.data.get(key)
    
    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        """Mock set"""
        self.data[key] = value
        if ex:
            self.expire_times[key] = ex
        return True
    
    async def delete(self, *keys: str) -> int:
        """Mock delete"""
        count = 0
        for key in keys:
            if key in self.data:
                del self.data[key]
                count += 1
        return count
    
    async def exists(self, *keys: str) -> int:
        """Mock exists"""
        return sum(1 for key in keys if key in self.data)
    
    async def expire(self, key: str, seconds: int) -> bool:
        """Mock expire"""
        if key in self.data:
            self.expire_times[key] = seconds
            return True
        return False
    
    async def ttl(self, key: str) -> int:
        """Mock ttl"""
        return self.expire_times.get(key, -1)
    
    async def keys(self, pattern: str) -> list:
        """Mock keys"""
        import re
        regex_pattern = pattern.replace('*', '.*')
        return [k for k in self.data.keys() if re.match(regex_pattern, k)]
    
    async def hset(self, name: str, key: str, value: str) -> int:
        """Mock hset"""
        if name not in self.data:
            self.data[name] = {}
        self.data[name][key] = value
        return 1
    
    async def hget(self, name: str, key: str) -> Optional[str]:
        """Mock hget"""
        if name in self.data and isinstance(self.data[name], dict):
            return self.data[name].get(key)
        return None
    
    async def hdel(self, name: str, *keys: str) -> int:
        """Mock hdel"""
        if name in self.data and isinstance(self.data[name], dict):
            count = 0
            for key in keys:
                if key in self.data[name]:
                    del self.data[name][key]
                    count += 1
            return count
        return 0
    
    def reset(self):
        """Reset data"""
        self.data = {}
        self.expire_times = {}


@pytest.fixture
def mock_sendgrid_client():
    """Fixture for mock SendGrid client"""
    return MockSendGridClient()


@pytest.fixture
def mock_razorpay_client():
    """Fixture for mock Razorpay client"""
    return MockRazorpayClient()


@pytest.fixture
def mock_s3_client():
    """Fixture for mock S3 client"""
    return MockS3Client()


@pytest.fixture
def mock_redis_client():
    """Fixture for mock Redis client"""
    return MockRedisClient()


def patch_sendgrid(mock_client: MockSendGridClient):
    """Context manager to patch SendGrid"""
    return patch('sendgrid.SendGridAPIClient', return_value=mock_client)


def patch_razorpay(mock_client: MockRazorpayClient):
    """Context manager to patch Razorpay"""
    return patch('razorpay.Client', return_value=mock_client)


def patch_s3(mock_client: MockS3Client):
    """Context manager to patch S3"""
    return patch('boto3.client', return_value=mock_client)


def patch_redis(mock_client: MockRedisClient):
    """Context manager to patch Redis"""
    return patch('src.redis_client.get_redis', return_value=mock_client)
