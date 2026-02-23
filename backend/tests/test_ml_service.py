"""
Unit tests for ML service
Tests cover all success and error scenarios for call_ml_model()
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import httpx
from fastapi import HTTPException
import os
import sys

# Add backend directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from ml_service import call_ml_model


@pytest.mark.asyncio
async def test_successful_ml_endpoint_call():
    """Test 5.2.1: Test successful ML endpoint call"""
    # Mock successful response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "prediction": "positive",
        "confidence": 0.85,
        "shap_values": {"feature1": 0.5, "feature2": -0.3}
    }
    
    with patch.dict(os.environ, {"ML_ENDPOINT_URL": "https://test.example.com/predict"}):
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            result = await call_ml_model("test input", {"extra": "data"})
            
            # Verify result structure
            assert result["prediction"] == "positive"
            assert result["confidence"] == 0.85
            assert result["shap_values"] == {"feature1": 0.5, "feature2": -0.3}
            
            # Verify the request was made correctly
            mock_client.post.assert_called_once()
            call_args = mock_client.post.call_args
            assert call_args[0][0] == "https://test.example.com/predict"
            assert call_args[1]["json"]["input_text"] == "test input"
            assert call_args[1]["json"]["extra_features"] == {"extra": "data"}


@pytest.mark.asyncio
async def test_bearer_token_inclusion_when_api_key_set():
    """Test 5.2.2: Test Bearer token inclusion when ML_API_KEY is set"""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "prediction": "test",
        "confidence": 0.9,
        "shap_values": {"f1": 0.1}
    }
    
    with patch.dict(os.environ, {
        "ML_ENDPOINT_URL": "https://test.example.com/predict",
        "ML_API_KEY": "test_api_key_123"
    }):
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            await call_ml_model("test input")
            
            # Verify Bearer token was included in headers
            call_args = mock_client.post.call_args
            headers = call_args[1]["headers"]
            assert "Authorization" in headers
            assert headers["Authorization"] == "Bearer test_api_key_123"


@pytest.mark.asyncio
async def test_bearer_token_omission_when_api_key_not_set():
    """Test 5.2.3: Test Bearer token omission when ML_API_KEY is not set"""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "prediction": "test",
        "confidence": 0.9,
        "shap_values": {"f1": 0.1}
    }
    
    # Ensure ML_API_KEY is not set
    env_vars = {"ML_ENDPOINT_URL": "https://test.example.com/predict"}
    if "ML_API_KEY" in os.environ:
        env_vars["ML_API_KEY"] = ""
    
    with patch.dict(os.environ, env_vars, clear=False):
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            # Temporarily remove ML_API_KEY if it exists
            original_key = os.environ.pop("ML_API_KEY", None)
            try:
                await call_ml_model("test input")
                
                # Verify Authorization header is NOT included
                call_args = mock_client.post.call_args
                headers = call_args[1]["headers"]
                assert "Authorization" not in headers
                assert headers["Content-Type"] == "application/json"
            finally:
                # Restore original key if it existed
                if original_key:
                    os.environ["ML_API_KEY"] = original_key


@pytest.mark.asyncio
async def test_connection_error_handling_503():
    """Test 5.2.4: Test connection error handling (503)"""
    with patch.dict(os.environ, {"ML_ENDPOINT_URL": "https://test.example.com/predict"}):
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post.side_effect = httpx.ConnectError("Connection refused")
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            with pytest.raises(HTTPException) as exc_info:
                await call_ml_model("test input")
            
            # Verify 503 status code
            assert exc_info.value.status_code == 503
            assert "Failed to connect to ML endpoint" in exc_info.value.detail


@pytest.mark.asyncio
async def test_timeout_error_handling_503():
    """Test 5.2.5: Test timeout error handling (503)"""
    with patch.dict(os.environ, {"ML_ENDPOINT_URL": "https://test.example.com/predict"}):
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post.side_effect = httpx.TimeoutException("Request timeout")
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            with pytest.raises(HTTPException) as exc_info:
                await call_ml_model("test input")
            
            # Verify 503 status code
            assert exc_info.value.status_code == 503
            assert "ML endpoint timeout" in exc_info.value.detail


@pytest.mark.asyncio
async def test_non_200_response_handling_502():
    """Test 5.2.6: Test non-200 response handling (502)"""
    mock_response = AsyncMock()
    mock_response.status_code = 500
    
    with patch.dict(os.environ, {"ML_ENDPOINT_URL": "https://test.example.com/predict"}):
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            with pytest.raises(HTTPException) as exc_info:
                await call_ml_model("test input")
            
            # Verify 502 status code
            assert exc_info.value.status_code == 502
            assert "ML endpoint returned status 500" in exc_info.value.detail


@pytest.mark.asyncio
async def test_invalid_response_structure_handling_502():
    """Test 5.2.7: Test invalid response structure handling (502)"""
    # Test missing required keys
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "prediction": "test",
        # Missing "confidence" and "shap_values"
    }
    
    with patch.dict(os.environ, {"ML_ENDPOINT_URL": "https://test.example.com/predict"}):
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            with pytest.raises(HTTPException) as exc_info:
                await call_ml_model("test input")
            
            # Verify 502 status code
            assert exc_info.value.status_code == 502
            assert "invalid response structure" in exc_info.value.detail


@pytest.mark.asyncio
async def test_missing_ml_endpoint_url_handling_500():
    """Test 5.2.8: Test missing ML_ENDPOINT_URL handling (500)"""
    # Ensure ML_ENDPOINT_URL is not set
    with patch.dict(os.environ, {}, clear=False):
        # Temporarily remove ML_ENDPOINT_URL
        original_url = os.environ.pop("ML_ENDPOINT_URL", None)
        try:
            with pytest.raises(HTTPException) as exc_info:
                await call_ml_model("test input")
            
            # Verify 500 status code
            assert exc_info.value.status_code == 500
            assert "ML_ENDPOINT_URL not configured" in exc_info.value.detail
        finally:
            # Restore original URL if it existed
            if original_url:
                os.environ["ML_ENDPOINT_URL"] = original_url
