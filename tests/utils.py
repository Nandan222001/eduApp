"""
Utility functions for tests.
"""
from typing import Dict, Any, Optional, List
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json


def create_auth_token(user_id: int, institution_id: int, role_id: int, email: str) -> str:
    """Create a test authentication token"""
    from src.utils.security import create_access_token
    
    return create_access_token(
        data={
            "sub": user_id,
            "institution_id": institution_id,
            "role_id": role_id,
            "email": email,
        }
    )


def get_auth_headers(token: str) -> Dict[str, str]:
    """Get authentication headers from token"""
    return {"Authorization": f"Bearer {token}"}


def assert_response_success(response, expected_status: int = 200):
    """Assert that API response is successful"""
    assert response.status_code == expected_status, \
        f"Expected status {expected_status}, got {response.status_code}. Response: {response.text}"


def assert_response_error(response, expected_status: int = 400):
    """Assert that API response is an error"""
    assert response.status_code == expected_status, \
        f"Expected error status {expected_status}, got {response.status_code}"


def assert_has_keys(data: Dict[str, Any], keys: List[str]):
    """Assert that dictionary has all specified keys"""
    for key in keys:
        assert key in data, f"Key '{key}' not found in response"


def assert_pagination(data: Dict[str, Any]):
    """Assert that response has pagination structure"""
    assert "items" in data or isinstance(data, list), \
        "Response should have 'items' key or be a list"
    
    if "items" in data:
        assert "total" in data or "total_count" in data, \
            "Paginated response should have total count"


def create_test_file(filename: str = "test.txt", content: bytes = b"test content"):
    """Create a test file object"""
    from io import BytesIO
    
    file = BytesIO(content)
    file.name = filename
    return file


def parse_datetime(date_string: str) -> datetime:
    """Parse datetime string to datetime object"""
    try:
        return datetime.fromisoformat(date_string.replace('Z', '+00:00'))
    except ValueError:
        return datetime.strptime(date_string, "%Y-%m-%dT%H:%M:%S.%f")


def datetime_to_iso(dt: datetime) -> str:
    """Convert datetime to ISO format string"""
    return dt.isoformat()


def create_date_range(days: int = 30) -> tuple:
    """Create a date range for testing"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    return start_date.date(), end_date.date()


def assert_valid_uuid(uuid_string: str):
    """Assert that string is a valid UUID"""
    import uuid
    try:
        uuid.UUID(uuid_string)
    except ValueError:
        raise AssertionError(f"'{uuid_string}' is not a valid UUID")


def assert_valid_email(email: str):
    """Assert that string is a valid email"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    assert re.match(pattern, email), f"'{email}' is not a valid email address"


def compare_dicts_partial(actual: Dict[str, Any], expected: Dict[str, Any]):
    """Compare two dictionaries, checking that actual contains all expected keys"""
    for key, value in expected.items():
        assert key in actual, f"Key '{key}' not found in actual dict"
        assert actual[key] == value, \
            f"Value mismatch for key '{key}': expected {value}, got {actual[key]}"


def load_test_fixture(fixture_name: str) -> Dict[str, Any]:
    """Load test fixture from JSON file"""
    import os
    fixture_path = os.path.join(
        os.path.dirname(__file__),
        'fixtures',
        f'{fixture_name}.json'
    )
    
    if os.path.exists(fixture_path):
        with open(fixture_path, 'r') as f:
            return json.load(f)
    return {}


def create_mock_request(
    method: str = "GET",
    url: str = "/",
    headers: Optional[Dict[str, str]] = None,
    json_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Create a mock HTTP request"""
    return {
        "method": method,
        "url": url,
        "headers": headers or {},
        "json": json_data
    }


def assert_sql_query_count(expected_count: int, tolerance: int = 0):
    """Context manager to assert SQL query count"""
    from sqlalchemy import event
    from sqlalchemy.engine import Engine
    
    class QueryCounter:
        def __init__(self):
            self.count = 0
        
        def __enter__(self):
            event.listen(Engine, "before_cursor_execute", self._before_cursor_execute)
            return self
        
        def __exit__(self, *args):
            event.remove(Engine, "before_cursor_execute", self._before_cursor_execute)
            actual_count = self.count
            min_count = expected_count - tolerance
            max_count = expected_count + tolerance
            assert min_count <= actual_count <= max_count, \
                f"Expected {expected_count}±{tolerance} queries, but {actual_count} were executed"
        
        def _before_cursor_execute(self, *args):
            self.count += 1
    
    return QueryCounter()


def wait_for_condition(condition_func, timeout: int = 5, interval: float = 0.1) -> bool:
    """Wait for a condition to become true"""
    import time
    
    start_time = time.time()
    while time.time() - start_time < timeout:
        if condition_func():
            return True
        time.sleep(interval)
    return False


def generate_random_string(length: int = 10) -> str:
    """Generate a random string"""
    import random
    import string
    
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))


def generate_random_email() -> str:
    """Generate a random email address"""
    return f"{generate_random_string()}@test.com"


def create_test_json_response(data: Any, status_code: int = 200) -> Dict[str, Any]:
    """Create a mock JSON response"""
    return {
        "status_code": status_code,
        "json": lambda: data,
        "text": json.dumps(data)
    }


def assert_datetime_recent(dt: datetime, max_seconds_ago: int = 60):
    """Assert that datetime is recent (within max_seconds_ago)"""
    now = datetime.utcnow()
    diff = (now - dt).total_seconds()
    assert diff <= max_seconds_ago, \
        f"Datetime {dt} is {diff} seconds old, expected within {max_seconds_ago} seconds"


def assert_list_contains_dict(list_of_dicts: List[Dict], expected_dict: Dict[str, Any]):
    """Assert that list contains a dictionary with specified key-value pairs"""
    for item in list_of_dicts:
        if all(item.get(k) == v for k, v in expected_dict.items()):
            return
    raise AssertionError(
        f"List does not contain a dict matching {expected_dict}\n"
        f"List contents: {list_of_dicts}"
    )


def cleanup_test_files(directory: str):
    """Clean up test files in directory"""
    import os
    import shutil
    
    if os.path.exists(directory):
        shutil.rmtree(directory)


def create_multipart_form_data(fields: Dict[str, Any]) -> Dict[str, tuple]:
    """Create multipart form data for file uploads"""
    form_data = {}
    for key, value in fields.items():
        if hasattr(value, 'read'):
            form_data[key] = (value.name, value, 'application/octet-stream')
        else:
            form_data[key] = (None, str(value))
    return form_data


class DatabaseTransactionRollback:
    """Context manager to rollback database transactions"""
    
    def __init__(self, db_session: Session):
        self.db_session = db_session
    
    def __enter__(self):
        self.db_session.begin_nested()
        return self.db_session
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.db_session.rollback()


def assert_model_equality(model1, model2, exclude_fields: Optional[List[str]] = None):
    """Assert that two ORM models have the same field values"""
    exclude_fields = exclude_fields or ['_sa_instance_state', 'created_at', 'updated_at']
    
    for key in model1.__dict__.keys():
        if key not in exclude_fields and not key.startswith('_'):
            value1 = getattr(model1, key)
            value2 = getattr(model2, key)
            assert value1 == value2, \
                f"Field '{key}' mismatch: {value1} != {value2}"


def mock_async_function(return_value=None):
    """Create a mock async function"""
    from unittest.mock import AsyncMock
    
    async def async_func(*args, **kwargs):
        return return_value
    
    return AsyncMock(side_effect=async_func)


def assert_decimals_equal(decimal1, decimal2, places: int = 2):
    """Assert that two Decimal values are equal within specified decimal places"""
    from decimal import Decimal
    
    if not isinstance(decimal1, Decimal):
        decimal1 = Decimal(str(decimal1))
    if not isinstance(decimal2, Decimal):
        decimal2 = Decimal(str(decimal2))
    
    diff = abs(decimal1 - decimal2)
    tolerance = Decimal(10) ** -places
    
    assert diff <= tolerance, \
        f"Decimals not equal: {decimal1} != {decimal2} (diff: {diff}, tolerance: {tolerance})"
