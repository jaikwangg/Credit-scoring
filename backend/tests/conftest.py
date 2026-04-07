"""
Pytest configuration and fixtures for test suite
Handles mocking of LangChain imports to avoid Pydantic compatibility issues
"""

import pytest
import sys
from unittest.mock import MagicMock, AsyncMock
import importlib


def _ensure_langchain_modules():
    """Use real LangChain modules when available, otherwise fall back to mocks."""
    modules = [
        "langchain",
        "langchain.prompts",
        "langchain_openai",
        "langchain_anthropic",
    ]

    for module_name in modules:
        try:
            importlib.import_module(module_name)
        except Exception:
            sys.modules[module_name] = MagicMock()


_ensure_langchain_modules()


@pytest.fixture(autouse=True)
def reset_modules():
    """Reset module cache before each test to ensure clean imports"""
    # Store original modules
    original_modules = {}
    modules_to_reset = ['main', 'ml_service', 'rag_service']
    
    for mod in modules_to_reset:
        if mod in sys.modules:
            original_modules[mod] = sys.modules[mod]
            del sys.modules[mod]
    
    yield
    
    # Clean up after test
    for mod in modules_to_reset:
        if mod in sys.modules:
            del sys.modules[mod]
