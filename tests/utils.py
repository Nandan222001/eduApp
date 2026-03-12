"""
Utility functions for tests.
"""
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import json

from src.utils.security import create_access_token


def create_test_token(
    user_id: int,
    institution_id: int,
    role_id: int,
    email: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a test authentication token."""
    data = {
        "sub": user_id,
        "institution_id": institution_id,
        "role_id": role_id,
        "email": email,
    }
    return create_access_token(data, expires_delta)


def get_auth_headers(token: str) -> Dict[str, str]:
    """Get authentication headers for API requests."""
    return {"Authorization": f"Bearer {token}"}


def assert_datetime_equal(dt1: datetime, dt2: datetime, delta_seconds: int = 5):
    """Assert that two datetimes are approximately equal."""
    diff = abs((dt1 - dt2).total_seconds())
    assert diff < delta_seconds, f"Datetimes differ by {diff} seconds"


def assert_response_success(response, expected_status: int = 200):
    """Assert that API response is successful."""
    assert response.status_code == expected_status, \
        f"Expected {expected_status}, got {response.status_code}: {response.text}"


def assert_response_error(response, expected_status: int = 400):
    """Assert that API response is an error."""
    assert response.status_code == expected_status, \
        f"Expected {expected_status}, got {response.status_code}: {response.text}"


def assert_dict_contains(actual: Dict[str, Any], expected: Dict[str, Any]):
    """Assert that actual dict contains all key-value pairs from expected dict."""
    for key, value in expected.items():
        assert key in actual, f"Key '{key}' not found in actual dict"
        assert actual[key] == value, \
            f"For key '{key}': expected {value}, got {actual[key]}"


def clean_dict_for_comparison(data: Dict[str, Any], exclude_keys: list = None) -> Dict[str, Any]:
    """Remove specified keys from dict for comparison."""
    if exclude_keys is None:
        exclude_keys = ['id', 'created_at', 'updated_at']
    
    return {k: v for k, v in data.items() if k not in exclude_keys}


def load_json_fixture(filename: str) -> Any:
    """Load JSON fixture file."""
    with open(f"tests/fixtures/{filename}", 'r') as f:
        return json.load(f)


def mock_file_upload(filename: str = "test.pdf", content: bytes = b"test content"):
    """Create a mock file upload object."""
    from io import BytesIO
    return BytesIO(content)


class APITestHelper:
    """Helper class for API testing."""
    
    def __init__(self, client, auth_headers: Optional[Dict[str, str]] = None):
        self.client = client
        self.auth_headers = auth_headers or {}
    
    def get(self, url: str, **kwargs):
        """Make authenticated GET request."""
        return self.client.get(url, headers=self.auth_headers, **kwargs)
    
    def post(self, url: str, **kwargs):
        """Make authenticated POST request."""
        return self.client.post(url, headers=self.auth_headers, **kwargs)
    
    def put(self, url: str, **kwargs):
        """Make authenticated PUT request."""
        return self.client.put(url, headers=self.auth_headers, **kwargs)
    
    def delete(self, url: str, **kwargs):
        """Make authenticated DELETE request."""
        return self.client.delete(url, headers=self.auth_headers, **kwargs)
    
    def assert_success(self, response, status: int = 200):
        """Assert response is successful."""
        assert_response_success(response, status)
        return response.json() if response.content else None
    
    def assert_error(self, response, status: int = 400):
        """Assert response is an error."""
        assert_response_error(response, status)
        return response.json() if response.content else None


def create_bulk_test_data(db_session, factory_class, count: int, **kwargs):
    """Create multiple test objects using a factory."""
    objects = []
    for _ in range(count):
        obj = factory_class.build(**kwargs)
        db_session.add(obj)
        objects.append(obj)
    db_session.commit()
    for obj in objects:
        db_session.refresh(obj)
    return objects
