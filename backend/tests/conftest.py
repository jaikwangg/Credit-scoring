"""
Pytest configuration and fixtures for test suite
Handles mocking of LangChain imports to avoid Pydantic compatibility issues
"""

import pytest
import sys
from unittest.mock import MagicMock, AsyncMock

# Mock LangChain modules before any imports to avoid Pydantic compatibility issues
sys.modules['langchain'] = MagicMock()
sys.modules['langchain.prompts'] = MagicMock()
sys.modules['langchain_openai'] = MagicMock()
sys.modules['langchain_anthropic'] = MagicMock()


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
