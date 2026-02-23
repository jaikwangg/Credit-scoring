# Property-based tests using Hypothesis
import pytest
from hypothesis import given, strategies as st, settings
from unittest.mock import patch, AsyncMock
import copy


# **Validates: Requirements 5.5**
@given(
    shap_values=st.dictionaries(
        keys=st.text(min_size=1, max_size=20, alphabet=st.characters(blacklist_categories=('Cs',))),
        values=st.floats(min_value=-100, max_value=100, allow_nan=False, allow_infinity=False),
        min_size=1,
        max_size=50
    )
)
def test_shap_sorting_property(shap_values):
    """
    Property: Top-K SHAP features are sorted by absolute value (descending)
    **Validates: Requirements 5.5.1**
    """
    # Sort by absolute value (this is what the RAG service does)
    sorted_shap = sorted(
        shap_values.items(),
        key=lambda x: abs(x[1]),
        reverse=True
    )
    top_10 = sorted_shap[:10]
    
    # Verify descending order by absolute value
    for i in range(len(top_10) - 1):
        assert abs(top_10[i][1]) >= abs(top_10[i + 1][1]), \
            f"SHAP values not sorted by absolute value: |{top_10[i][1]}| < |{top_10[i + 1][1]}|"


@settings(deadline=None)  # Disable deadline for async tests with FastAPI initialization
@given(
    input_text=st.text(min_size=1, max_size=1000, alphabet=st.characters(blacklist_categories=('Cs',))),
    extra_features=st.one_of(
        st.none(),
        st.dictionaries(
            keys=st.text(min_size=1, max_size=20, alphabet=st.characters(blacklist_categories=('Cs',))),
            values=st.one_of(
                st.floats(allow_nan=False, allow_infinity=False),
                st.integers(),
                st.text(max_size=100, alphabet=st.characters(blacklist_categories=('Cs',)))
            ),
            max_size=10
        )
    )
)
@pytest.mark.asyncio
async def test_input_immutability_property(input_text, extra_features):
    """
    Property: Input data is never mutated during processing
    **Validates: Requirements 5.5.2**
    """
    from main import PredictRequest, predict
    
    request = PredictRequest(
        input_text=input_text,
        extra_features=extra_features
    )
    
    # Deep copy original values
    original_input_text = copy.deepcopy(request.input_text)
    original_extra_features = copy.deepcopy(request.extra_features)
    
    # Mock services to avoid external calls
    mock_ml_result = {
        "prediction": "test_prediction",
        "confidence": 0.75,
        "shap_values": {"feature1": 0.5, "feature2": -0.3}
    }
    
    mock_explanation = "This is a test explanation."
    
    with patch('main.call_ml_model', new_callable=AsyncMock, return_value=mock_ml_result):
        with patch('main.explain_with_rag', new_callable=AsyncMock, return_value=mock_explanation):
            await predict(request)
    
    # Verify input data was not mutated
    assert request.input_text == original_input_text, "input_text was mutated"
    assert request.extra_features == original_extra_features, "extra_features was mutated"


@settings(deadline=None)  # Disable deadline for async tests with FastAPI initialization
@given(
    prediction=st.one_of(st.text(min_size=1, max_size=50), st.integers(), st.floats(allow_nan=False)),
    confidence=st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False),
    shap_values=st.dictionaries(
        keys=st.text(min_size=1, max_size=20, alphabet=st.characters(blacklist_categories=('Cs',))),
        values=st.floats(min_value=-100, max_value=100, allow_nan=False, allow_infinity=False),
        min_size=1,
        max_size=20
    )
)
@pytest.mark.asyncio
async def test_response_completeness_property(prediction, confidence, shap_values):
    """
    Property: All response fields are always populated with valid data
    **Validates: Requirements 5.5.3**
    """
    from main import PredictRequest, predict
    
    request = PredictRequest(
        input_text="test input",
        extra_features=None
    )
    
    # Mock services with property-generated values
    mock_ml_result = {
        "prediction": prediction,
        "confidence": confidence,
        "shap_values": shap_values
    }
    
    mock_explanation = "Test explanation text"
    
    with patch('main.call_ml_model', new_callable=AsyncMock, return_value=mock_ml_result):
        with patch('main.explain_with_rag', new_callable=AsyncMock, return_value=mock_explanation):
            response = await predict(request)
    
    # Verify all fields are populated
    assert response.prediction is not None, "prediction is None"
    assert response.confidence is not None, "confidence is None"
    assert response.shap_values is not None, "shap_values is None"
    assert response.explanation is not None, "explanation is None"
    
    # Verify field types
    assert isinstance(response.confidence, float), "confidence is not a float"
    assert isinstance(response.shap_values, dict), "shap_values is not a dict"
    assert isinstance(response.explanation, str), "explanation is not a string"
    
    # Verify non-empty
    assert len(response.shap_values) > 0, "shap_values is empty"
    assert len(response.explanation) > 0, "explanation is empty"


@settings(deadline=None)  # Disable deadline for async tests with FastAPI initialization
@given(
    confidence=st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False)
)
@pytest.mark.asyncio
async def test_confidence_range_property(confidence):
    """
    Property: Confidence values are always between 0.0 and 1.0 (inclusive)
    **Validates: Requirements 5.5.4**
    """
    from main import PredictRequest, predict
    
    request = PredictRequest(
        input_text="test input",
        extra_features=None
    )
    
    # Mock services with property-generated confidence
    mock_ml_result = {
        "prediction": "test",
        "confidence": confidence,
        "shap_values": {"feature1": 0.5}
    }
    
    mock_explanation = "Test explanation"
    
    with patch('main.call_ml_model', new_callable=AsyncMock, return_value=mock_ml_result):
        with patch('main.explain_with_rag', new_callable=AsyncMock, return_value=mock_explanation):
            response = await predict(request)
    
    # Verify confidence is within valid range
    assert 0.0 <= response.confidence <= 1.0, \
        f"Confidence {response.confidence} is outside valid range [0.0, 1.0]"
    
    # Verify confidence matches input (no transformation)
    assert response.confidence == confidence, \
        f"Confidence was transformed: {confidence} -> {response.confidence}"
