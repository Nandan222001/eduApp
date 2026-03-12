import pytest
from datetime import datetime, timedelta
from src.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)


@pytest.mark.unit
class TestPasswordHashing:
    """Test password hashing utilities."""

    def test_hash_password(self):
        """Test password hashing."""
        password = "test_password_123"
        hashed = get_password_hash(password)

        assert hashed is not None
        assert hashed != password
        assert len(hashed) > 0

    def test_verify_correct_password(self):
        """Test password verification with correct password."""
        password = "test_password_123"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_verify_incorrect_password(self):
        """Test password verification with incorrect password."""
        password = "test_password_123"
        wrong_password = "wrong_password"
        hashed = get_password_hash(password)

        assert verify_password(wrong_password, hashed) is False

    def test_same_password_different_hashes(self):
        """Test that same password generates different hashes."""
        password = "test_password_123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        assert hash1 != hash2
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


@pytest.mark.unit
class TestTokenGeneration:
    """Test JWT token generation and validation."""

    def test_create_access_token(self):
        """Test access token creation."""
        data = {"sub": 1, "email": "test@example.com"}
        token = create_access_token(data)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_refresh_token(self):
        """Test refresh token creation."""
        data = {"sub": 1, "email": "test@example.com"}
        token = create_refresh_token(data)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_decode_valid_access_token(self):
        """Test decoding valid access token."""
        data = {"sub": 1, "email": "test@example.com"}
        token = create_access_token(data)
        payload = decode_token(token)

        assert payload is not None
        assert payload["sub"] == 1
        assert payload["email"] == "test@example.com"
        assert payload["type"] == "access"

    def test_decode_valid_refresh_token(self):
        """Test decoding valid refresh token."""
        data = {"sub": 1, "email": "test@example.com"}
        token = create_refresh_token(data)
        payload = decode_token(token)

        assert payload is not None
        assert payload["sub"] == 1
        assert payload["email"] == "test@example.com"
        assert payload["type"] == "refresh"

    def test_decode_invalid_token(self):
        """Test decoding invalid token."""
        invalid_token = "invalid.token.string"
        payload = decode_token(invalid_token)

        assert payload is None

    def test_access_token_with_custom_expiry(self):
        """Test access token with custom expiry time."""
        data = {"sub": 1, "email": "test@example.com"}
        custom_expiry = timedelta(minutes=10)
        token = create_access_token(data, expires_delta=custom_expiry)
        payload = decode_token(token)

        assert payload is not None
        assert "exp" in payload

        exp_time = datetime.fromtimestamp(payload["exp"])
        expected_exp = datetime.utcnow() + custom_expiry
        time_diff = abs((exp_time - expected_exp).total_seconds())
        assert time_diff < 5

    def test_refresh_token_with_custom_expiry(self):
        """Test refresh token with custom expiry time."""
        data = {"sub": 1, "email": "test@example.com"}
        custom_expiry = timedelta(days=1)
        token = create_refresh_token(data, expires_delta=custom_expiry)
        payload = decode_token(token)

        assert payload is not None
        assert "exp" in payload

    def test_token_contains_all_data(self):
        """Test that token contains all provided data."""
        data = {
            "sub": 1,
            "email": "test@example.com",
            "institution_id": 5,
            "role_id": 2,
        }
        token = create_access_token(data)
        payload = decode_token(token)

        assert payload is not None
        assert payload["sub"] == 1
        assert payload["email"] == "test@example.com"
        assert payload["institution_id"] == 5
        assert payload["role_id"] == 2
