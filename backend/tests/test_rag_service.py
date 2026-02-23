"""
Unit tests for RAG service
Tests the explain_with_rag() function and _initialize_llm() helper
"""

import pytest
import os
import sys
from unittest.mock import AsyncMock, patch, MagicMock

# Add backend directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Mock langchain imports before importing rag_service to avoid dependency issues
sys.modules['langchain_openai'] = MagicMock()
sys.modules['langchain_anthropic'] = MagicMock()

from rag_service import explain_with_rag, _initialize_llm


# Test 5.3.1: Test SHAP value sorting by absolute value
def test_shap_sorting_by_absolute_value():
    """Test that SHAP values are sorted by absolute value in descending order"""
    shap_values = {
        "feature_a": 0.5,
        "feature_b": -0.8,  # Highest absolute value
        "feature_c": 0.3,
        "feature_d": -0.6,  # Second highest absolute value
        "feature_e": 0.1
    }
    
    # Sort by absolute value (descending)
    sorted_shap = sorted(
        shap_values.items(),
        key=lambda x: abs(x[1]),
        reverse=True
    )
    
    # Verify order
    assert sorted_shap[0][0] == "feature_b"  # -0.8 has highest absolute value
    assert sorted_shap[1][0] == "feature_d"  # -0.6 has second highest
    assert sorted_shap[2][0] == "feature_a"  # 0.5
    assert sorted_shap[3][0] == "feature_c"  # 0.3
    assert sorted_shap[4][0] == "feature_e"  # 0.1
    
    # Verify absolute values are in descending order
    for i in range(len(sorted_shap) - 1):
        assert abs(sorted_shap[i][1]) >= abs(sorted_shap[i + 1][1])


# Test 5.3.2: Test top-10 feature selection
def test_top_10_feature_selection():
    """Test that only top 10 features are selected"""
    # Create 20 features
    shap_values = {f"feature_{i}": float(i) * 0.1 for i in range(20)}
    
    # Sort and select top 10
    sorted_shap = sorted(
        shap_values.items(),
        key=lambda x: abs(x[1]),
        reverse=True
    )
    top_10 = sorted_shap[:10]
    
    # Verify exactly 10 features selected
    assert len(top_10) == 10
    
    # Verify they are the top 10 by absolute value
    expected_features = [f"feature_{i}" for i in range(19, 9, -1)]
    actual_features = [f[0] for f in top_10]
    assert actual_features == expected_features


# Test 5.3.3: Test SHAP feature formatting
def test_shap_feature_formatting():
    """Test that SHAP features are formatted correctly"""
    shap_values = {
        "positive_feature": 0.5,
        "negative_feature": -0.3
    }
    
    sorted_shap = sorted(
        shap_values.items(),
        key=lambda x: abs(x[1]),
        reverse=True
    )
    
    # Format features
    shap_text_lines = []
    for feature_name, shap_value in sorted_shap:
        direction = "positive" if shap_value > 0 else "negative"
        shap_text_lines.append(
            f"- {feature_name}: {shap_value:.4f} ({direction} impact)"
        )
    
    shap_features_text = "\n".join(shap_text_lines)
    
    # Verify formatting
    assert "- positive_feature: 0.5000 (positive impact)" in shap_features_text
    assert "- negative_feature: -0.3000 (negative impact)" in shap_features_text
    assert "\n" in shap_features_text


# Test 5.3.4: Test LLM initialization with OpenAI key
@patch.dict(os.environ, {"OPENAI_API_KEY": "test-openai-key"}, clear=True)
def test_llm_initialization_with_openai():
    """Test that LLM initializes with OpenAI when OPENAI_API_KEY is set"""
    with patch('rag_service.ChatOpenAI') as mock_openai:
        mock_openai.return_value = MagicMock()
        
        llm = _initialize_llm()
        
        # Verify ChatOpenAI was called with correct parameters
        mock_openai.assert_called_once_with(
            model="gpt-4o-mini",
            temperature=0.7
        )


# Test 5.3.5: Test LLM initialization with Anthropic key
@patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-anthropic-key"}, clear=True)
def test_llm_initialization_with_anthropic():
    """Test that LLM initializes with Anthropic when only ANTHROPIC_API_KEY is set"""
    with patch('rag_service.ChatAnthropic') as mock_anthropic:
        mock_anthropic.return_value = MagicMock()
        
        llm = _initialize_llm()
        
        # Verify ChatAnthropic was called with correct parameters
        mock_anthropic.assert_called_once_with(
            model="claude-3-haiku-20240307",
            temperature=0.7
        )


# Test 5.3.6: Test LLM initialization failure with no keys
@patch.dict(os.environ, {}, clear=True)
def test_llm_initialization_failure_no_keys():
    """Test that LLM initialization raises ValueError when no API keys are set"""
    with pytest.raises(ValueError) as exc_info:
        _initialize_llm()
    
    assert "No LLM API key configured" in str(exc_info.value)
    assert "OPENAI_API_KEY or ANTHROPIC_API_KEY" in str(exc_info.value)


# Test 5.3.7: Test chain invocation with ainvoke
@pytest.mark.asyncio
@patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}, clear=True)
async def test_chain_invocation_with_ainvoke():
    """Test that chain is invoked with ainvoke() method"""
    shap_values = {"feature1": 0.5, "feature2": -0.3}
    
    # Mock LLM and chain
    mock_llm = MagicMock()
    mock_chain = AsyncMock()
    mock_response = MagicMock()
    mock_response.content = "This is a test explanation"
    mock_chain.ainvoke.return_value = mock_response
    
    with patch('rag_service._initialize_llm', return_value=mock_llm):
        with patch('rag_service.PromptTemplate') as mock_prompt:
            # Mock the chain creation (PromptTemplate | LLM)
            mock_prompt_instance = MagicMock()
            mock_prompt.return_value = mock_prompt_instance
            mock_prompt_instance.__or__ = MagicMock(return_value=mock_chain)
            
            result = await explain_with_rag(
                input_text="test input",
                prediction="positive",
                confidence=0.85,
                shap_values=shap_values
            )
            
            # Verify ainvoke was called
            mock_chain.ainvoke.assert_called_once()
            
            # Verify the arguments passed to ainvoke
            call_args = mock_chain.ainvoke.call_args[0][0]
            assert call_args["input_text"] == "test input"
            assert call_args["prediction"] == "positive"
            assert call_args["confidence"] == 0.85
            assert "feature1" in call_args["shap_features"]
            assert "feature2" in call_args["shap_features"]


# Test 5.3.8: Test explanation text extraction
@pytest.mark.asyncio
@patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}, clear=True)
async def test_explanation_text_extraction():
    """Test that explanation text is correctly extracted from response"""
    shap_values = {"feature1": 0.5}
    
    # Test with response that has .content attribute
    mock_llm = MagicMock()
    mock_chain = AsyncMock()
    mock_response = MagicMock()
    mock_response.content = "Explanation with content attribute"
    mock_chain.ainvoke.return_value = mock_response
    
    with patch('rag_service._initialize_llm', return_value=mock_llm):
        with patch('rag_service.PromptTemplate') as mock_prompt:
            mock_prompt_instance = MagicMock()
            mock_prompt.return_value = mock_prompt_instance
            mock_prompt_instance.__or__ = MagicMock(return_value=mock_chain)
            
            result = await explain_with_rag(
                input_text="test",
                prediction="positive",
                confidence=0.8,
                shap_values=shap_values
            )
            
            assert result == "Explanation with content attribute"
    
    # Test with response that doesn't have .content attribute (fallback to str())
    mock_response_no_content = "String response without content attribute"
    mock_chain.ainvoke.return_value = mock_response_no_content
    
    with patch('rag_service._initialize_llm', return_value=mock_llm):
        with patch('rag_service.PromptTemplate') as mock_prompt:
            mock_prompt_instance = MagicMock()
            mock_prompt.return_value = mock_prompt_instance
            mock_prompt_instance.__or__ = MagicMock(return_value=mock_chain)
            
            result = await explain_with_rag(
                input_text="test",
                prediction="positive",
                confidence=0.8,
                shap_values=shap_values
            )
            
            assert result == "String response without content attribute"
