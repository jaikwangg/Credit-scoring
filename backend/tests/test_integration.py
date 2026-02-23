"""
Integration tests for end-to-end workflows
Tests verify complete prediction workflow, CORS integration, and error propagation
These tests mock at the service level to test integration between components
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
import os


@pytest.fixture
def client():
    """Create a test client for the FastAPI application"""
    # Mock environment variables for testing
    with patch.dict(os.environ, {
        "ML_ENDPOINT_URL": "http://test-ml-endpoint.com/predict",
        "OPENAI_API_KEY": "test-openai-key",
        "FRONTEND_URL": "http://localhost:3000"
    }, clear=False):
        # Import inside fixture to avoid module-level import issues
        import sys
        # Remove cached modules to ensure fresh import with mocked env
        modules_to_remove = [m for m in sys.modules if m.startswith('main') or m.startswith('ml_service') or m.startswith('rag_service')]
        for mod in modules_to_remove:
            sys.modules.pop(mod, None)
        
        from main import app
        return TestClient(app)


@pytest.fixture
def mock_ml_result():
    """Mock ML service result with comprehensive SHAP values"""
    return {
        "prediction": "positive_sentiment",
        "confidence": 0.87,
        "shap_values": {
            "word_excellent": 0.45,
            "word_quality": 0.32,
            "word_slow": -0.28,
            "sentiment_score": 0.15,
            "word_product": 0.12,
            "word_delivery": -0.10,
            "customer_segment": 0.08,
            "order_value": 0.05,
            "word_but": -0.03,
            "word_was": 0.01
        }
    }


@pytest.fixture
def mock_explanation():
    """Mock RAG explanation"""
    return """The model predicts positive sentiment with 87% confidence.

Key factors influencing this prediction:
- "excellent" (0.45) and "quality" (0.32) strongly indicate positive sentiment
- "slow" (-0.28) has negative impact but is outweighed by positive terms
- "product" (0.12) and "sentiment_score" (0.15) contribute positively

Recommendations:
- Address delivery speed to improve overall customer satisfaction
- Maintain product quality as it's a key driver of positive sentiment
- Consider premium customer segment expectations for faster delivery"""


# Test 5.6.1: Test end-to-end prediction workflow
def test_end_to_end_prediction_workflow(client, mock_ml_result, mock_explanation):
    """
    Test complete prediction workflow from request to response
    Verifies that ML and RAG services are called in sequence and response is complete
    """
    with patch('main.call_ml_model', new_callable=AsyncMock) as mock_ml:
        with patch('main.explain_with_rag', new_callable=AsyncMock) as mock_rag:
            mock_ml.return_value = mock_ml_result
            mock_rag.return_value = mock_explanation
            
            response = client.post(
                "/predict",
                json={
                    "input_text": "The product quality is excellent but delivery was slow",
                    "extra_features": {
                        "customer_segment": "premium",
                        "order_value": 299.99
                    }
                }
            )
            
            # Verify response status and structure
            assert response.status_code == 200
            data = response.json()
            
            # Verify all response fields are present and correct
            assert data["prediction"] == "positive_sentiment"
            assert data["confidence"] == 0.87
            assert isinstance(data["shap_values"], dict)
            assert len(data["shap_values"]) == 10
            assert "word_excellent" in data["shap_values"]
            assert data["shap_values"]["word_excellent"] == 0.45
            assert isinstance(data["explanation"], str)
            assert len(data["explanation"]) > 0
            assert "positive sentiment" in data["explanation"]
            
            # Verify ML service was called with correct parameters
            mock_ml.assert_called_once_with(
                input_text="The product quality is excellent but delivery was slow",
                extra_features={"customer_segment": "premium", "order_value": 299.99}
            )
            
            # Verify RAG service was called with ML results
            mock_rag.assert_called_once_with(
                input_text="The product quality is excellent but delivery was slow",
                prediction="positive_sentiment",
                confidence=0.87,
                shap_values=mock_ml_result["shap_values"]
            )


def test_end_to_end_workflow_without_extra_features(client):
    """Test end-to-end workflow with minimal request (no extra_features)"""
    mock_ml_result = {
        "prediction": "neutral",
        "confidence": 0.65,
        "shap_values": {"word_okay": 0.05, "word_fine": 0.03}
    }
    mock_explanation = "The model predicts neutral sentiment with 65% confidence."
    
    with patch('main.call_ml_model', new_callable=AsyncMock) as mock_ml:
        with patch('main.explain_with_rag', new_callable=AsyncMock) as mock_rag:
            mock_ml.return_value = mock_ml_result
            mock_rag.return_value = mock_explanation
            
            response = client.post(
                "/predict",
                json={"input_text": "The product is okay"}
            )
            
            # Verify response
            assert response.status_code == 200
            data = response.json()
            assert data["prediction"] == "neutral"
            assert data["confidence"] == 0.65
            
            # Verify ML service was called without extra_features
            mock_ml.assert_called_once_with(
                input_text="The product is okay",
                extra_features=None
            )


# Test 5.6.2: Test CORS integration
def test_cors_integration_with_allowed_origin(client, mock_ml_result, mock_explanation):
    """Test CORS integration allows requests from configured frontend URL"""
    with patch('main.call_ml_model', new_callable=AsyncMock) as mock_ml:
        with patch('main.explain_with_rag', new_callable=AsyncMock) as mock_rag:
            mock_ml.return_value = mock_ml_result
            mock_rag.return_value = mock_explanation
            
            response = client.post(
                "/predict",
                json={"input_text": "test input"},
                headers={"Origin": "http://localhost:3000"}
            )
            
            # Verify CORS headers are present
            assert response.status_code == 200
            assert "access-control-allow-origin" in response.headers
            assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
            assert "access-control-allow-credentials" in response.headers
            assert response.headers["access-control-allow-credentials"] == "true"


def test_cors_preflight_options_request(client):
    """Test CORS preflight OPTIONS request is handled correctly"""
    response = client.options(
        "/predict",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type"
        }
    )
    
    # Preflight should return 200
    assert response.status_code == 200
    
    # Verify CORS headers are present
    assert "access-control-allow-origin" in response.headers
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert "access-control-allow-methods" in response.headers
    assert "access-control-allow-headers" in response.headers
    assert "access-control-allow-credentials" in response.headers


def test_cors_integration_on_health_endpoint(client):
    """Test CORS headers are present on health endpoint"""
    response = client.get(
        "/health",
        headers={"Origin": "http://localhost:3000"}
    )
    
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


# Test 5.6.3: Test error propagation from ML service
def test_error_propagation_ml_connection_failure(client):
    """Test that ML service connection errors propagate correctly as 503"""
    from fastapi import HTTPException
    
    async def mock_ml_error(*args, **kwargs):
        raise HTTPException(status_code=503, detail="Failed to connect to ML endpoint: Connection refused")
    
    with patch('main.call_ml_model', new_callable=AsyncMock, side_effect=mock_ml_error):
        response = client.post(
            "/predict",
            json={"input_text": "test input"}
        )
        
        # Should return 503 Service Unavailable
        assert response.status_code == 503
        data = response.json()
        assert "detail" in data
        assert "Failed to connect" in data["detail"]


def test_error_propagation_ml_timeout(client):
    """Test that ML service timeout errors propagate correctly as 503"""
    from fastapi import HTTPException
    
    async def mock_ml_error(*args, **kwargs):
        raise HTTPException(status_code=503, detail="ML endpoint timeout: Request timeout")
    
    with patch('main.call_ml_model', new_callable=AsyncMock, side_effect=mock_ml_error):
        response = client.post(
            "/predict",
            json={"input_text": "test input"}
        )
        
        # Should return 503 Service Unavailable
        assert response.status_code == 503
        data = response.json()
        assert "detail" in data
        assert "timeout" in data["detail"].lower()


def test_error_propagation_ml_bad_response_status(client):
    """Test that ML service non-200 responses propagate correctly as 502"""
    from fastapi import HTTPException
    
    async def mock_ml_error(*args, **kwargs):
        raise HTTPException(status_code=502, detail="ML endpoint returned status 500")
    
    with patch('main.call_ml_model', new_callable=AsyncMock, side_effect=mock_ml_error):
        response = client.post(
            "/predict",
            json={"input_text": "test input"}
        )
        
        # Should return 502 Bad Gateway
        assert response.status_code == 502
        data = response.json()
        assert "detail" in data
        assert "ML endpoint returned status" in data["detail"]


def test_error_propagation_ml_invalid_response_structure(client):
    """Test that ML service invalid response structure propagates correctly as 502"""
    from fastapi import HTTPException
    
    async def mock_ml_error(*args, **kwargs):
        raise HTTPException(status_code=502, detail="ML endpoint returned invalid response structure")
    
    with patch('main.call_ml_model', new_callable=AsyncMock, side_effect=mock_ml_error):
        response = client.post(
            "/predict",
            json={"input_text": "test input"}
        )
        
        # Should return 502 Bad Gateway
        assert response.status_code == 502
        data = response.json()
        assert "detail" in data
        assert "invalid response structure" in data["detail"]


# Test 5.6.4: Test error propagation from RAG service
def test_error_propagation_rag_llm_initialization_failure(client, mock_ml_result):
    """Test that RAG service LLM initialization errors propagate correctly"""
    # RAG service errors are not wrapped in HTTPException, so they bubble up as 500
    # This test verifies that the error is caught by FastAPI's error handler
    async def mock_rag_error(*args, **kwargs):
        raise ValueError("No LLM API key configured")
    
    with patch('main.call_ml_model', new_callable=AsyncMock, return_value=mock_ml_result):
        with patch('main.explain_with_rag', new_callable=AsyncMock, side_effect=mock_rag_error):
            # In test environment, unhandled exceptions raise directly
            # In production, FastAPI would catch and return 500
            with pytest.raises(ValueError):
                response = client.post(
                    "/predict",
                    json={"input_text": "test input"}
                )


def test_error_propagation_rag_chain_invocation_failure(client, mock_ml_result):
    """Test that RAG service chain invocation errors propagate correctly"""
    # RAG service errors are not wrapped in HTTPException, so they bubble up as 500
    # This test verifies that the error is caught by FastAPI's error handler
    async def mock_rag_error(*args, **kwargs):
        raise Exception("LLM API rate limit exceeded")
    
    with patch('main.call_ml_model', new_callable=AsyncMock, return_value=mock_ml_result):
        with patch('main.explain_with_rag', new_callable=AsyncMock, side_effect=mock_rag_error):
            # In test environment, unhandled exceptions raise directly
            # In production, FastAPI would catch and return 500
            with pytest.raises(Exception):
                response = client.post(
                    "/predict",
                    json={"input_text": "test input"}
                )


def test_error_propagation_rag_with_ml_success(client, mock_ml_result):
    """Test that errors in RAG service don't affect ML service execution"""
    async def mock_rag_error(*args, **kwargs):
        raise Exception("RAG service error")
    
    with patch('main.call_ml_model', new_callable=AsyncMock) as mock_ml:
        with patch('main.explain_with_rag', new_callable=AsyncMock, side_effect=mock_rag_error):
            mock_ml.return_value = mock_ml_result
            
            # In test environment, unhandled exceptions raise directly
            # Verify ML service was called successfully before RAG error
            with pytest.raises(Exception):
                response = client.post(
                    "/predict",
                    json={"input_text": "test input"}
                )
            
            # Verify ML service was called successfully before RAG error
            mock_ml.assert_called_once()
