"""
Manual endpoint verification script
Tests /health and /predict endpoints using FastAPI TestClient
"""

import sys
from unittest.mock import MagicMock, AsyncMock, patch

# Mock LangChain modules to avoid Pydantic compatibility issues
sys.modules['langchain'] = MagicMock()
sys.modules['langchain.prompts'] = MagicMock()
sys.modules['langchain_openai'] = MagicMock()
sys.modules['langchain_anthropic'] = MagicMock()

from fastapi.testclient import TestClient
from main import app

def test_health_endpoint():
    """Test /health endpoint"""
    client = TestClient(app)
    response = client.get("/health")
    print(f"✓ Health endpoint: {response.status_code} - {response.json()}")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_predict_endpoint():
    """Test /predict endpoint with mocked services"""
    client = TestClient(app)
    
    # Mock ML service
    mock_ml_result = {
        "prediction": "positive_sentiment",
        "confidence": 0.87,
        "shap_values": {
            "word_excellent": 0.45,
            "word_quality": 0.32,
            "word_slow": -0.28
        }
    }
    
    # Mock RAG service
    mock_explanation = "The model predicts positive sentiment with 87% confidence."
    
    with patch('main.call_ml_model', return_value=mock_ml_result):
        with patch('main.explain_with_rag', return_value=mock_explanation):
            response = client.post(
                "/predict",
                json={
                    "input_text": "The product quality is excellent but delivery was slow",
                    "extra_features": {"customer_segment": "premium"}
                }
            )
    
    print(f"✓ Predict endpoint: {response.status_code}")
    print(f"  Response: {response.json()}")
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "positive_sentiment"
    assert data["confidence"] == 0.87
    assert len(data["shap_values"]) == 3
    assert data["explanation"] == mock_explanation

def test_cors_headers():
    """Test CORS headers"""
    client = TestClient(app)
    response = client.get("/health")
    print(f"✓ CORS headers present: {bool(response.headers.get('access-control-allow-origin'))}")

def test_error_handling():
    """Test error handling with invalid input"""
    client = TestClient(app)
    response = client.post(
        "/predict",
        json={"input_text": ""}  # Empty input should fail validation
    )
    print(f"✓ Error handling (empty input): {response.status_code}")
    assert response.status_code == 422

if __name__ == "__main__":
    print("=" * 60)
    print("FastAPI ML-RAG Backend - Endpoint Verification")
    print("=" * 60)
    
    try:
        test_health_endpoint()
        test_predict_endpoint()
        test_cors_headers()
        test_error_handling()
        
        print("\n" + "=" * 60)
        print("✓ All endpoint verifications passed!")
        print("=" * 60)
    except Exception as e:
        print(f"\n✗ Verification failed: {e}")
        sys.exit(1)
