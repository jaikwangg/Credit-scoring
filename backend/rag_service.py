"""
RAG Service Module
Generates natural language explanations using LangChain RAG pipeline
"""

import os
from typing import Dict, Any
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic


async def explain_with_rag(
    input_text: str,
    prediction: Any,
    confidence: float,
    shap_values: Dict[str, float]
) -> str:
    """
    Generate explanation using LangChain RAG pipeline
    
    Args:
        input_text: Original input text
        prediction: Model prediction result
        confidence: Confidence score
        shap_values: Dictionary of feature SHAP values
        
    Returns:
        Plain text explanation string
    """
    # Step 1: Sort SHAP values by absolute value (descending)
    # ขั้นตอนที่ 1: เรียง SHAP values ตามค่าสัมบูรณ์ (มากไปน้อย)
    sorted_shap = sorted(
        shap_values.items(),
        key=lambda x: abs(x[1]),
        reverse=True
    )
    
    # Step 2: Select top 10 features
    top_shap = sorted_shap[:10]
    
    # Step 3: Format SHAP features into readable text lines
    # ขั้นตอนที่ 3: จัดรูปแบบ SHAP features ให้อ่านง่าย
    shap_text_lines = []
    for feature_name, shap_value in top_shap:
        # กำหนดทิศทางของผลกระทบ (บวกหรือลบ)
        direction = "positive" if shap_value > 0 else "negative"
        shap_text_lines.append(
            f"- {feature_name}: {shap_value:.4f} ({direction} impact)"
        )
    
    # Step 4: Join formatted lines with newlines
    shap_features_text = "\n".join(shap_text_lines)
    
    # Step 5: Create PromptTemplate with input_variables
    # ขั้นตอนที่ 5: สร้าง prompt template พร้อม input variables
    prompt_template = PromptTemplate(
        input_variables=["input_text", "prediction", "confidence", "shap_features"],
        template="""You are an AI assistant explaining machine learning predictions.

Input Text: {input_text}

Prediction: {prediction}
Confidence: {confidence:.2%}

Top SHAP Feature Contributions:
{shap_features}

Please provide a clear explanation that covers:
1. What the prediction means in plain language
2. How the top SHAP features influenced this prediction
3. Recommendations or insights based on the results

Keep the explanation concise and actionable."""
    )
    
    # Step 6: Call _initialize_llm() helper function
    # ขั้นตอนที่ 6: เรียกใช้ helper function เพื่อเริ่มต้น LLM
    llm = _initialize_llm()
    
    # Step 7: Create chain using PromptTemplate | LLM
    chain = prompt_template | llm
    
    # Step 8: Invoke chain with ainvoke() passing all variables
    # ขั้นตอนที่ 8: เรียก chain แบบ async พร้อมส่งตัวแปรทั้งหมด
    response = await chain.ainvoke({
        "input_text": input_text,
        "prediction": str(prediction),
        "confidence": confidence,
        "shap_features": shap_features_text
    })
    
    # Step 9: Extract text from response (handle different response formats)
    # ขั้นตอนที่ 9: ดึงข้อความจาก response (รองรับหลายรูปแบบ)
    # LangChain response format depends on LLM type
    if hasattr(response, "content"):
        explanation = response.content
    else:
        explanation = str(response)
    
    # Step 10: Return explanation string
    return explanation


def _initialize_llm():
    """
    Initialize LLM based on environment configuration
    
    Preconditions:
        - At least one LLM API key is set in environment
        
    Postconditions:
        - Returns configured LLM instance
        - Defaults to OpenAI gpt-4o-mini if available
    """
    # Try OpenAI first (default)
    # ลองใช้ OpenAI ก่อน (ค่าเริ่มต้น)
    if os.getenv("OPENAI_API_KEY"):
        return ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7
        )
    
    # Fallback to Anthropic
    # ถ้าไม่มี OpenAI ให้ใช้ Anthropic แทน
    elif os.getenv("ANTHROPIC_API_KEY"):
        return ChatAnthropic(
            model="claude-3-haiku-20240307",
            temperature=0.7
        )
    
    else:
        raise ValueError(
            "No LLM API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY"
        )
