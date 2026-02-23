"""
Unit tests for FastAPI application
Tests cover /predict endpoint, /health endpoint, CORS, and startup validation
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock
import os


@pytest.fixture
def client():
    """Create a test client for the FastAPI application"""
    # Mock environment variables for testing
    with patch.dict(os.environ, {
        "ML_ENDPOINT_URL": "http://test-ml-endpoint.com",
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
    """Mock ML service result"""
    return {
        "prediction": "positive_sentiment",
        "confidence": 0.87,
        "shap_values": {
            "word_excellent": 0.45,
            "word_quality": 0.32,
            "word_slow": -0.28,
            "sentiment_score": 0.15
        }
    }


@pytest.fixture
def mock_explanation():
    """Mock RAG explanation"""
    return """The model predicts positive sentiment with 87% confidence.

Key factors:
- "excellent" and "quality" strongly indicate positive sentiment
- "slow" has negative impact but is outweighed by positive terms

Recommendation: Address delivery speed to improve overall satisfaction."""


# Test 5.4.1: Test /predict endpoint with valid request
def test_predict_endpoint_valid_request(client, mock_ml_result, mock_explanation):
    """Test /predict endpoint with valid request returns complete response"""
    with patch('main.call_ml_model', new_callable=AsyncMock) as mock_ml:
        with patch('main.explain_with_rag', new_callable=AsyncMock) as mock_rag:
            mock_ml.return_value = mock_ml_result
            mock_rag.return_value = mock_explanation
            
            response = client.post(
                "/predict",
                json={
                    "input_text": "The product quality is excellent but delivery was slow",
                    "extra_features": {"customer_segment": "premium"}
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # Verify all response fields are present
            assert data["prediction"] == "positive_sentiment"
            assert data["confidence"] == 0.87
            assert len(data["shap_values"]) == 4
            assert "excellent" in data["explanation"]
            
            # Verify ML service was called with correct parameters
            mock_ml.assert_called_once_with(
                input_text="The product quality is excellent but delivery was slow",
                extra_features={"customer_segment": "premium"}
            )
            
            # Verify RAG service was called with ML results
            mock_rag.assert_called_once_with(
                input_text="The product quality is excellent but delivery was slow",
                prediction="positive_sentiment",
                confidence=0.87,
                shap_values=mock_ml_result["shap_values"]
            )


# Test 5.4.2: Test /predict endpoint with empty input_text (422)
def test_predict_endpoint_empty_input_text(client):
    """Test /predict endpoint with empty input_text returns 422 validation error"""
    response = client.post(
        "/predict",
        json={
            "input_text": "",
            "extra_features": None
        }
    )
    
    assert response.status_code == 422
    data = response.json()
    
    # Verify validation error details
    assert "detail" in data
    # Check that the error is about input_text validation
    error_details = str(data["detail"])
    assert "input_text" in error_details.lower()


def test_predict_endpoint_missing_input_text(client):
    """Test /predict endpoint with missing input_text returns 422 validation error"""
    response = client.post(
        "/predict",
        json={
            "extra_features": {"feature1": "value1"}
        }
    )
    
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data


# Test 5.4.3: Test /predict endpoint sequential service calls
def test_predict_endpoint_sequential_service_calls(client, mock_ml_result, mock_explanation):
    """Test that ML service is called before RAG service in correct order"""
    call_order = []
    
    async def mock_ml_call(*args, **kwargs):
        call_order.append("ml")
        return mock_ml_result
    
    async def mock_rag_call(*args, **kwargs):
        call_order.append("rag")
        return mock_explanation
    
    with patch('main.call_ml_model', new_callable=AsyncMock, side_effect=mock_ml_call):
        with patch('main.explain_with_rag', new_callable=AsyncMock, side_effect=mock_rag_call):
            response = client.post(
                "/predict",
                json={
                    "input_text": "test input",
                    "extra_features": None
                }
            )
            
            assert response.status_code == 200
            # Verify services were called in correct order: ML then RAG
            assert call_order == ["ml", "rag"]


def test_predict_endpoint_ml_service_error_propagation(client):
    """Test that ML service errors propagate correctly to client"""
    from fastapi import HTTPException
    
    async def mock_ml_error(*args, **kwargs):
        raise HTTPException(status_code=503, detail="ML service unavailable")
    
    with patch('main.call_ml_model', new_callable=AsyncMock, side_effect=mock_ml_error):
        response = client.post(
            "/predict",
            json={
                "input_text": "test input"
            }
        )
        
        assert response.status_code == 503
        assert "ML service unavailable" in response.json()["detail"]


def test_predict_endpoint_rag_service_error_propagation(client, mock_ml_result):
    """Test that RAG service errors propagate correctly to client"""
    from fastapi import HTTPException
    
    async def mock_rag_error(*args, **kwargs):
        raise HTTPException(status_code=500, detail="LLM API error")
    
    with patch('main.call_ml_model', new_callable=AsyncMock, return_value=mock_ml_result):
        with patch('main.explain_with_rag', new_callable=AsyncMock, side_effect=mock_rag_error):
            response = client.post(
                "/predict",
                json={
                    "input_text": "test input"
                }
            )
            
            # Should return 500 for internal server error
            assert response.status_code == 500
            assert "LLM API error" in response.json()["detail"]


# Test 5.4.4: Test /health endpoint
def test_health_endpoint(client):
    """Test /health endpoint returns healthy status"""
    response = client.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    
    assert "status" in data
    assert data["status"] == "healthy"


def test_health_endpoint_no_side_effects(client):
    """Test /health endpoint has no side effects and can be called multiple times"""
    response1 = client.get("/health")
    response2 = client.get("/health")
    response3 = client.get("/health")
    
    assert response1.status_code == 200
    assert response2.status_code == 200
    assert response3.status_code == 200
    
    assert response1.json() == response2.json() == response3.json()


# Test 5.4.5: Test CORS headers
def test_cors_headers_on_predict_endpoint(client):
    """Test CORS headers are set correctly on /predict endpoint"""
    with patch('main.call_ml_model', new_callable=AsyncMock) as mock_ml:
        with patch('main.explain_with_rag', new_callable=AsyncMock) as mock_rag:
            mock_ml.return_value = {
                "prediction": "test",
                "confidence": 0.5,
                "shap_values": {"f1": 0.1}
            }
            mock_rag.return_value = "test explanation"
            
            response = client.post(
                "/predict",
                json={"input_text": "test"},
                headers={"Origin": "http://localhost:3000"}
            )
            
            # Verify CORS headers are present
            assert "access-control-allow-origin" in response.headers
            assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_cors_headers_on_health_endpoint(client):
    """Test CORS headers are set correctly on /health endpoint"""
    response = client.get(
        "/health",
        headers={"Origin": "http://localhost:3000"}
    )
    
    # Verify CORS headers are present
    assert "access-control-allow-origin" in response.headers
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_cors_preflight_request(client):
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
    
    # Verify CORS headers
    assert "access-control-allow-origin" in response.headers
    assert "access-control-allow-methods" in response.headers


# Test 5.4.6: Test startup validation with missing config
@pytest.mark.asyncio
async def test_startup_validation_missing_ml_endpoint():
    """Test startup validation fails when ML_ENDPOINT_URL is missing"""
    # Test the validation logic directly by mocking os.getenv
    with patch('os.getenv') as mock_getenv:
        def getenv_side_effect(key, default=None):
            if key == "ML_ENDPOINT_URL":
                return None
            elif key == "OPENAI_API_KEY":
                return "test-key"
            elif key == "ANTHROPIC_API_KEY":
                return None
            return default
        
        mock_getenv.side_effect = getenv_side_effect
        
        # Import and call validation
        import sys
        modules_to_remove = [m for m in sys.modules if m.startswith('main')]
        for mod in modules_to_remove:
            sys.modules.pop(mod, None)
        
        from main import validate_configuration
        
        with pytest.raises(RuntimeError) as exc_info:
            await validate_configuration()
        
        assert "ML_ENDPOINT_URL" in str(exc_info.value)


@pytest.mark.asyncio
async def test_startup_validation_missing_llm_api_key():
    """Test startup validation fails when no LLM API key is configured"""
    # Test the validation logic directly by mocking os.getenv
    with patch('os.getenv') as mock_getenv:
        def getenv_side_effect(key, default=None):
            if key == "ML_ENDPOINT_URL":
                return "http://test-ml-endpoint.com"
            elif key == "OPENAI_API_KEY":
                return None
            elif key == "ANTHROPIC_API_KEY":
                return None
            return default
        
        mock_getenv.side_effect = getenv_side_effect
        
        # Import and call validation
        import sys
        modules_to_remove = [m for m in sys.modules if m.startswith('main')]
        for mod in modules_to_remove:
            sys.modules.pop(mod, None)
        
        from main import validate_configuration
        
        with pytest.raises(RuntimeError) as exc_info:
            await validate_configuration()
        
        error_message = str(exc_info.value)
        assert "LLM API key" in error_message or "OPENAI_API_KEY" in error_message or "ANTHROPIC_API_KEY" in error_message


def test_startup_validation_success_with_openai():
    """Test startup validation succeeds with ML_ENDPOINT_URL and OPENAI_API_KEY"""
    import sys
    
    with patch.dict(os.environ, {
        "ML_ENDPOINT_URL": "http://test-ml-endpoint.com",
        "OPENAI_API_KEY": "test-openai-key"
    }, clear=True):
        # Remove cached modules
        modules_to_remove = [m for m in sys.modules if m.startswith('main') or m.startswith('ml_service') or m.startswith('rag_service')]
        for mod in modules_to_remove:
            sys.modules.pop(mod, None)
        
        from main import app
        # Should not raise any exception
        client = TestClient(app)
        assert client is not None


def test_startup_validation_success_with_anthropic():
    """Test startup validation succeeds with ML_ENDPOINT_URL and ANTHROPIC_API_KEY"""
    import sys
    
    with patch.dict(os.environ, {
        "ML_ENDPOINT_URL": "http://test-ml-endpoint.com",
        "ANTHROPIC_API_KEY": "test-anthropic-key"
    }, clear=True):
        # Remove cached modules
        modules_to_remove = [m for m in sys.modules if m.startswith('main') or m.startswith('ml_service') or m.startswith('rag_service')]
        for mod in modules_to_remove:
            sys.modules.pop(mod, None)
        
        from main import app
        # Should not raise any exception
        client = TestClient(app)
        assert client is not None
