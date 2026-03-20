"""
Root conftest.py for pytest configuration and global fixtures.
"""
import pytest
from _pytest.config import Config
from _pytest.config.argparsing import Parser


def pytest_configure(config: Config) -> None:
    """Configure pytest with custom settings."""
    config.addinivalue_line(
        "markers",
        "unit: Unit tests that don't require external services"
    )
    config.addinivalue_line(
        "markers",
        "integration: Integration tests that require database/redis"
    )
    config.addinivalue_line(
        "markers",
        "e2e: End-to-end tests"
    )
    config.addinivalue_line(
        "markers",
        "slow: Tests that take a long time to run"
    )
    config.addinivalue_line(
        "markers",
        "smoke: Quick smoke tests"
    )
    config.addinivalue_line(
        "markers",
        "critical: Critical path tests"
    )


def pytest_addoption(parser: Parser) -> None:
    """Add custom command line options."""
    parser.addoption(
        "--run-slow",
        action="store_true",
        default=False,
        help="Run slow tests"
    )
    parser.addoption(
        "--run-e2e",
        action="store_true",
        default=False,
        help="Run end-to-end tests"
    )


def pytest_collection_modifyitems(config: Config, items: list) -> None:
    """Modify test collection based on markers and options."""
    skip_slow = pytest.mark.skip(reason="Need --run-slow option to run")
    skip_e2e = pytest.mark.skip(reason="Need --run-e2e option to run")
    
    for item in items:
        if "slow" in item.keywords and not config.getoption("--run-slow"):
            item.add_marker(skip_slow)
        if "e2e" in item.keywords and not config.getoption("--run-e2e"):
            item.add_marker(skip_e2e)
