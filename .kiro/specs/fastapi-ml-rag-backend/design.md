# Design Document: FastAPI ML-RAG Backend

## Overview

A FastAPI middleware service that orchestrates requests between a frontend client and two backend services: a cloud-hosted ML model endpoint and a LangChain RAG pipeline. The service receives prediction requests, forwards them to the ML model, enriches the results with natural language explanations via RAG, and returns a unified response. The architecture emphasizes clean separation of concerns with dedicated service modules for ML and RAG operations, all using async/await patterns for optimal performance.

## Architecture

```mermaid
graph TD
    A[Frontend Client] -->|POST /predict| B[FastAPI main.py]
    B -->|call_ml_model| C[ml_service.py]
    C -->|HTTP POST| D[Cloud ML Endpoint]
    D -->|prediction + SHAP| C
    C -->|result dict| B
    B -->|explain_with_rag| E[rag_service.py]
    E -->|LangChain chain| F[LLM API]
    F -->|explanation text| E
    E -->|explanation| B
    B -->|unified response| A
    
    G[.env] -.->|config| B
    G -.->|config| C
    G -.->|config| E
```

## Main Workflow Sequence

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant API as FastAPI main.py
    participant ML as ml_service.py
    participant Cloud as ML Endpoint
    participant RAG as rag_service.py
    participant LLM as LangChain LLM
    
    Client->>API: POST /predict {input_text, extra_features}
    API->>ML: call_ml_model(input_text, extra_features)
    ML->>Cloud: POST with Bearer token
    Cloud-->>ML: {prediction, confidence, shap_values}
    ML-->>API: result dict
    API->>RAG: explain_with_rag(input_text, prediction, confidence, shap_values)
    RAG->>RAG: Format top 10 SHAP features
    RAG->>LLM: ainvoke with prompt template
    LLM-->>RAG: explanation text
    RAG-->>API: explanation string
    API-->>Client: {prediction, confidence, shap_values, explanation}
```

## Components and Interfaces

### Component 1: FastAPI Application (main.py)

**Purpose**: Entry point for the API, handles HTTP routing, CORS, and orchestrates calls to ML and RAG services

**Interface**:
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

class PredictRequest(BaseModel):
    input_text: str
    extra_features: Optional[Dict[str, Any]] = None

class PredictResponse(BaseModel):
    prediction: Any
    confidence: float
    shap_values: Dict[str, float]
    explanation: str

app = FastAPI()

@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest) -> PredictResponse:
    """Main prediction endpoint that orchestrates ML and RAG services"""
    pass

@app.get("/health")
async def health() -> Dict[str, str]:
    """Health check endpoint"""
    pass
```

**Responsibilities**:
- Configure CORS middleware from FRONTEND_URL environment variable
- Validate incoming requests using Pydantic models
- Orchestrate sequential calls: ML model → RAG explanation
- Handle errors and return appropriate HTTP status codes
- Load environment variables using python-dotenv

### Component 2: ML Service (ml_service.py)

**Purpose**: Handles communication with the cloud-hosted ML model endpoint

**Interface**:
```python
import httpx
from typing import Dict, Any, Optional

async def call_ml_model(
    input_text: str, 
    extra_features: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Call cloud ML model endpoint asynchronously
    
    Args:
        input_text: Text input for prediction
        extra_features: Optional additional features for the model
        
    Returns:
        Dict containing:
            - prediction: Model prediction result
            - confidence: Confidence score (float)
            - shap_values: Dict of feature names to SHAP values
            
    Raises:
        HTTPException: 502 for bad response, 503 for connection failure
    """
    pass
```

**Responsibilities**:
- Create async HTTP client using httpx.AsyncClient
- Read ML_ENDPOINT_URL and ML_API_KEY from environment
- Add Bearer token authentication if ML_API_KEY is present
- Format request payload with input_text and extra_features
- Parse response and validate structure
- Raise HTTPException with appropriate status codes on failure
- Close HTTP client properly (use async context manager)

### Component 3: RAG Service (rag_service.py)

**Purpose**: Generates natural language explanations using LangChain RAG pipeline

**Interface**:
```python
from typing import Dict, Any

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
    pass
```

**Responsibilities**:
- Sort SHAP values by absolute value and select top 10 features
- Format SHAP features into readable text
- Create LangChain PromptTemplate with placeholders for input_text, prediction, confidence, and shap_features
- Initialize LLM from environment (default: OpenAI gpt-4o-mini)
- Build LangChain chain (PromptTemplate | LLM)
- Call chain.ainvoke() asynchronously
- Extract and return explanation text
- Handle LLM API errors gracefully

## Data Models

### PredictRequest

```python
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class PredictRequest(BaseModel):
    input_text: str = Field(..., min_length=1, description="Text input for ML model")
    extra_features: Optional[Dict[str, Any]] = Field(
        None, 
        description="Optional additional features for the model"
    )
```

**Validation Rules**:
- input_text must be non-empty string
- extra_features is optional, can be None or dict with any structure

### PredictResponse

```python
from pydantic import BaseModel, Field
from typing import Dict, Any

class PredictResponse(BaseModel):
    prediction: Any = Field(..., description="Model prediction result")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    shap_values: Dict[str, float] = Field(..., description="SHAP feature importance values")
    explanation: str = Field(..., description="Natural language explanation from RAG")
```

**Validation Rules**:
- prediction can be any type (depends on ML model)
- confidence must be float between 0.0 and 1.0
- shap_values must be dict with string keys and float values
- explanation must be non-empty string

### MLModelResponse (Internal)

```python
from typing import Dict, Any

class MLModelResponse:
    """Expected structure from cloud ML endpoint"""
    prediction: Any
    confidence: float
    shap_values: Dict[str, float]
```

## Algorithmic Pseudocode

### Main Prediction Workflow

```python
async def predict(request: PredictRequest) -> PredictResponse:
    """
    Main prediction endpoint algorithm
    
    Preconditions:
        - request.input_text is non-empty string
        - Environment variables are loaded
        - ML and RAG services are importable
        
    Postconditions:
        - Returns PredictResponse with all required fields
        - ML model has been called successfully
        - RAG explanation has been generated
        - No side effects on input data
        
    Loop Invariants: N/A (no loops in main flow)
    """
    # Step 1: Call ML model service
    # ขั้นตอนที่ 1: เรียก ML model service
    ml_result = await call_ml_model(
        input_text=request.input_text,
        extra_features=request.extra_features
    )
    
    # Step 2: Extract ML results
    prediction = ml_result["prediction"]
    confidence = ml_result["confidence"]
    shap_values = ml_result["shap_values"]
    
    # Step 3: Generate explanation using RAG
    # ขั้นตอนที่ 3: สร้างคำอธิบายด้วย RAG
    explanation = await explain_with_rag(
        input_text=request.input_text,
        prediction=prediction,
        confidence=confidence,
        shap_values=shap_values
    )
    
    # Step 4: Return unified response
    return PredictResponse(
        prediction=prediction,
        confidence=confidence,
        shap_values=shap_values,
        explanation=explanation
    )
```

### ML Model Call Algorithm

```python
async def call_ml_model(
    input_text: str, 
    extra_features: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Call cloud ML endpoint with retry logic
    
    Preconditions:
        - input_text is non-empty string
        - ML_ENDPOINT_URL environment variable is set
        - httpx library is available
        
    Postconditions:
        - Returns dict with prediction, confidence, shap_values keys
        - HTTP connection is properly closed
        - Raises HTTPException on failure with appropriate status code
        
    Loop Invariants: N/A
    """
    # Step 1: Load configuration from environment
    # ขั้นตอนที่ 1: โหลดค่า config จาก environment
    ml_endpoint_url = os.getenv("ML_ENDPOINT_URL")
    ml_api_key = os.getenv("ML_API_KEY")
    
    if not ml_endpoint_url:
        raise HTTPException(status_code=500, detail="ML_ENDPOINT_URL not configured")
    
    # Step 2: Prepare request payload
    payload = {
        "input_text": input_text
    }
    if extra_features:
        payload["extra_features"] = extra_features
    
    # Step 3: Prepare headers with optional Bearer token
    # ขั้นตอนที่ 3: เตรียม headers พร้อม Bearer token (ถ้ามี)
    headers = {"Content-Type": "application/json"}
    if ml_api_key:
        headers["Authorization"] = f"Bearer {ml_api_key}"
    
    # Step 4: Make async HTTP request
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                ml_endpoint_url,
                json=payload,
                headers=headers
            )
            
            # Step 5: Validate response status
            if response.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"ML endpoint returned status {response.status_code}"
                )
            
            # Step 6: Parse and validate response structure
            # ขั้นตอนที่ 6: แปลงและตรวจสอบโครงสร้างของ response
            result = response.json()
            
            required_keys = ["prediction", "confidence", "shap_values"]
            if not all(key in result for key in required_keys):
                raise HTTPException(
                    status_code=502,
                    detail="ML endpoint returned invalid response structure"
                )
            
            return result
            
    except httpx.ConnectError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to connect to ML endpoint: {str(e)}"
        )
    except httpx.TimeoutException as e:
        raise HTTPException(
            status_code=503,
            detail=f"ML endpoint timeout: {str(e)}"
        )
```

### RAG Explanation Algorithm

```python
async def explain_with_rag(
    input_text: str,
    prediction: Any,
    confidence: float,
    shap_values: Dict[str, float]
) -> str:
    """
    Generate explanation using LangChain RAG
    
    Preconditions:
        - input_text is non-empty string
        - confidence is float between 0.0 and 1.0
        - shap_values is non-empty dict
        - LLM API key is configured in environment
        
    Postconditions:
        - Returns non-empty explanation string
        - No mutations to input parameters
        - LangChain chain has been invoked successfully
        
    Loop Invariants:
        - During SHAP sorting: All processed items maintain (feature, value) pairs
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
    
    # Step 3: Format SHAP features into readable text
    # ขั้นตอนที่ 3: จัดรูปแบบ SHAP features ให้อ่านง่าย
    shap_text_lines = []
    for feature_name, shap_value in top_shap:
        direction = "positive" if shap_value > 0 else "negative"
        shap_text_lines.append(
            f"- {feature_name}: {shap_value:.4f} ({direction} impact)"
        )
    shap_features_text = "\n".join(shap_text_lines)
    
    # Step 4: Create prompt template
    # ขั้นตอนที่ 4: สร้าง prompt template
    from langchain.prompts import PromptTemplate
    
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
    
    # Step 5: Initialize LLM from environment
    # ขั้นตอนที่ 5: เริ่มต้น LLM จาก environment config
    llm = _initialize_llm()
    
    # Step 6: Create LangChain chain
    chain = prompt_template | llm
    
    # Step 7: Invoke chain asynchronously
    # ขั้นตอนที่ 7: เรียก chain แบบ async
    response = await chain.ainvoke({
        "input_text": input_text,
        "prediction": str(prediction),
        "confidence": confidence,
        "shap_features": shap_features_text
    })
    
    # Step 8: Extract text from response
    # LangChain response format depends on LLM type
    if hasattr(response, "content"):
        explanation = response.content
    else:
        explanation = str(response)
    
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
    import os
    from langchain_openai import ChatOpenAI
    from langchain_anthropic import ChatAnthropic
    
    # Try OpenAI first (default)
    if os.getenv("OPENAI_API_KEY"):
        return ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7
        )
    
    # Fallback to Anthropic
    elif os.getenv("ANTHROPIC_API_KEY"):
        return ChatAnthropic(
            model="claude-3-haiku-20240307",
            temperature=0.7
        )
    
    else:
        raise ValueError(
            "No LLM API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY"
        )
```

## Key Functions with Formal Specifications

### Function 1: predict()

```python
@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest) -> PredictResponse
```

**Preconditions:**
- `request.input_text` is non-empty string
- `request.extra_features` is None or valid dict
- Environment variables (ML_ENDPOINT_URL, OPENAI_API_KEY or ANTHROPIC_API_KEY) are set
- ML and RAG services are properly initialized

**Postconditions:**
- Returns PredictResponse with all required fields populated
- `response.confidence` is between 0.0 and 1.0
- `response.shap_values` is non-empty dict
- `response.explanation` is non-empty string
- No mutations to input request object
- Both ML and RAG services have been called exactly once

**Loop Invariants:** N/A (sequential async calls, no loops)

### Function 2: call_ml_model()

```python
async def call_ml_model(
    input_text: str, 
    extra_features: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]
```

**Preconditions:**
- `input_text` is non-empty string
- `extra_features` is None or valid dict
- ML_ENDPOINT_URL environment variable is set and valid URL
- httpx library is available

**Postconditions:**
- Returns dict with keys: "prediction", "confidence", "shap_values"
- `result["confidence"]` is float
- `result["shap_values"]` is dict with string keys and float values
- HTTP connection is properly closed (via context manager)
- Raises HTTPException(502) if ML endpoint returns non-200 status
- Raises HTTPException(503) if connection fails or times out
- No side effects on input parameters

**Loop Invariants:** N/A

### Function 3: explain_with_rag()

```python
async def explain_with_rag(
    input_text: str,
    prediction: Any,
    confidence: float,
    shap_values: Dict[str, float]
) -> str
```

**Preconditions:**
- `input_text` is non-empty string
- `confidence` is float between 0.0 and 1.0
- `shap_values` is non-empty dict with string keys and float values
- At least one LLM API key (OPENAI_API_KEY or ANTHROPIC_API_KEY) is set
- LangChain libraries are available

**Postconditions:**
- Returns non-empty string containing explanation
- Explanation addresses: prediction meaning, SHAP impact, recommendations
- Top 10 SHAP features (by absolute value) are included in prompt
- LangChain chain has been invoked with ainvoke() (async)
- No mutations to input parameters

**Loop Invariants:**
- During SHAP sorting loop: All items maintain (feature_name, shap_value) tuple structure
- During formatting loop: Each iteration produces one formatted line

### Function 4: health()

```python
@app.get("/health")
async def health() -> Dict[str, str]
```

**Preconditions:**
- FastAPI application is running

**Postconditions:**
- Returns dict with "status" key
- Response indicates service availability
- No side effects

**Loop Invariants:** N/A

## Example Usage

### Example 1: Basic Prediction Request

```python
import httpx
import asyncio

async def test_predict():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/predict",
            json={
                "input_text": "Customer feedback: The product quality is excellent but delivery was slow",
                "extra_features": {
                    "customer_segment": "premium",
                    "order_value": 299.99
                }
            }
        )
        
        result = response.json()
        print(f"Prediction: {result['prediction']}")
        print(f"Confidence: {result['confidence']:.2%}")
        print(f"\nTop SHAP Features:")
        for feature, value in list(result['shap_values'].items())[:5]:
            print(f"  {feature}: {value:.4f}")
        print(f"\nExplanation:\n{result['explanation']}")

asyncio.run(test_predict())
```

### Example 2: Health Check

```python
import httpx
import asyncio

async def check_health():
    async with httpx.AsyncClient() as client:
        response = await client.get("http://localhost:8000/health")
        print(response.json())  # {"status": "healthy"}

asyncio.run(check_health())
```

### Example 3: Error Handling

```python
import httpx
import asyncio

async def test_error_handling():
    async with httpx.AsyncClient() as client:
        try:
            # Test with empty input
            response = await client.post(
                "http://localhost:8000/predict",
                json={"input_text": ""}
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            print(f"Validation error: {e.response.json()}")
        
        try:
            # Test when ML endpoint is down
            response = await client.post(
                "http://localhost:8000/predict",
                json={"input_text": "test input"}
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 503:
                print("ML service unavailable")
            elif e.response.status_code == 502:
                print("ML service returned bad response")

asyncio.run(test_error_handling())
```

### Example 4: Running the Server

```python
# main.py - Complete minimal example
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI(title="ML-RAG Backend", version="1.0.0")

# Configure CORS
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import services
from ml_service import call_ml_model
from rag_service import explain_with_rag

# Models
class PredictRequest(BaseModel):
    input_text: str = Field(..., min_length=1)
    extra_features: Optional[Dict[str, Any]] = None

class PredictResponse(BaseModel):
    prediction: Any
    confidence: float = Field(..., ge=0.0, le=1.0)
    shap_values: Dict[str, float]
    explanation: str

# Endpoints
@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest) -> PredictResponse:
    # Call ML model
    ml_result = await call_ml_model(
        input_text=request.input_text,
        extra_features=request.extra_features
    )
    
    # Generate explanation
    explanation = await explain_with_rag(
        input_text=request.input_text,
        prediction=ml_result["prediction"],
        confidence=ml_result["confidence"],
        shap_values=ml_result["shap_values"]
    )
    
    return PredictResponse(
        prediction=ml_result["prediction"],
        confidence=ml_result["confidence"],
        shap_values=ml_result["shap_values"],
        explanation=explanation
    )

@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "healthy"}

# Run with: uvicorn main:app --reload
```

## Correctness Properties

### Property 1: Sequential Service Invocation
```python
# ∀ request ∈ PredictRequest:
#   predict(request) → call_ml_model() executes before explain_with_rag()
#   AND explain_with_rag() receives output from call_ml_model()

async def test_sequential_invocation():
    """Verify ML service is called before RAG service"""
    call_order = []
    
    # Mock services to track call order
    original_ml = call_ml_model
    original_rag = explain_with_rag
    
    async def tracked_ml(*args, **kwargs):
        call_order.append("ml")
        return await original_ml(*args, **kwargs)
    
    async def tracked_rag(*args, **kwargs):
        call_order.append("rag")
        return await original_rag(*args, **kwargs)
    
    # Execute prediction
    request = PredictRequest(input_text="test")
    await predict(request)
    
    assert call_order == ["ml", "rag"], "Services must be called in order: ML then RAG"
```

### Property 2: Response Completeness
```python
# ∀ request ∈ PredictRequest:
#   response = predict(request) →
#     response.prediction ≠ None AND
#     0.0 ≤ response.confidence ≤ 1.0 AND
#     len(response.shap_values) > 0 AND
#     len(response.explanation) > 0

async def test_response_completeness():
    """Verify all response fields are populated"""
    request = PredictRequest(
        input_text="test input",
        extra_features={"feature1": 1.0}
    )
    
    response = await predict(request)
    
    assert response.prediction is not None
    assert 0.0 <= response.confidence <= 1.0
    assert len(response.shap_values) > 0
    assert len(response.explanation) > 0
    assert all(isinstance(v, float) for v in response.shap_values.values())
```

### Property 3: Input Immutability
```python
# ∀ request ∈ PredictRequest:
#   original_request = copy(request)
#   predict(request)
#   request == original_request (no mutations)

async def test_input_immutability():
    """Verify input request is not mutated"""
    import copy
    
    request = PredictRequest(
        input_text="test input",
        extra_features={"feature1": 1.0}
    )
    
    original_request = copy.deepcopy(request)
    await predict(request)
    
    assert request.input_text == original_request.input_text
    assert request.extra_features == original_request.extra_features
```

### Property 4: SHAP Top-K Selection
```python
# ∀ shap_values ∈ Dict[str, float]:
#   formatted_shap = format_top_shap(shap_values, k=10) →
#     len(formatted_shap) ≤ min(10, len(shap_values)) AND
#     ∀ i, j where i < j: |formatted_shap[i].value| ≥ |formatted_shap[j].value|

def test_shap_top_k_selection():
    """Verify top 10 SHAP features are selected by absolute value"""
    shap_values = {
        f"feature_{i}": (-1) ** i * (i + 1) * 0.1
        for i in range(20)
    }
    
    # Sort by absolute value
    sorted_shap = sorted(
        shap_values.items(),
        key=lambda x: abs(x[1]),
        reverse=True
    )
    top_10 = sorted_shap[:10]
    
    assert len(top_10) == 10
    
    # Verify descending order by absolute value
    for i in range(len(top_10) - 1):
        assert abs(top_10[i][1]) >= abs(top_10[i + 1][1])
```

### Property 5: HTTP Error Code Correctness
```python
# ∀ ml_endpoint_failure:
#   connection_error → HTTPException(503)
#   bad_response → HTTPException(502)
#   missing_config → HTTPException(500)

async def test_http_error_codes():
    """Verify correct HTTP status codes for different failure modes"""
    import pytest
    from unittest.mock import patch, AsyncMock
    
    # Test connection failure → 503
    with patch('httpx.AsyncClient.post', side_effect=httpx.ConnectError("Connection failed")):
        with pytest.raises(HTTPException) as exc_info:
            await call_ml_model("test input")
        assert exc_info.value.status_code == 503
    
    # Test bad response → 502
    mock_response = AsyncMock()
    mock_response.status_code = 500
    with patch('httpx.AsyncClient.post', return_value=mock_response):
        with pytest.raises(HTTPException) as exc_info:
            await call_ml_model("test input")
        assert exc_info.value.status_code == 502
    
    # Test missing config → 500
    with patch.dict(os.environ, {}, clear=True):
        with pytest.raises(HTTPException) as exc_info:
            await call_ml_model("test input")
        assert exc_info.value.status_code == 500
```

### Property 6: Async Execution
```python
# ∀ function ∈ {predict, call_ml_model, explain_with_rag}:
#   function is async AND
#   all I/O operations use await

async def test_async_execution():
    """Verify all functions are properly async"""
    import inspect
    
    assert inspect.iscoroutinefunction(predict)
    assert inspect.iscoroutinefunction(call_ml_model)
    assert inspect.iscoroutinefunction(explain_with_rag)
    
    # Verify no blocking calls (httpx.AsyncClient, chain.ainvoke)
    # This is enforced by code review and linting
```

## Error Handling

### Error Scenario 1: ML Endpoint Connection Failure

**Condition**: Network error or ML endpoint is unreachable
**Response**: HTTPException with status_code=503
**Recovery**: 
- Return error to client with descriptive message
- Client can retry after delay
- Consider implementing circuit breaker pattern for production

**Example**:
```python
try:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(ml_endpoint_url, json=payload, headers=headers)
except httpx.ConnectError as e:
    raise HTTPException(
        status_code=503,
        detail=f"Failed to connect to ML endpoint: {str(e)}"
    )
```

### Error Scenario 2: ML Endpoint Bad Response

**Condition**: ML endpoint returns non-200 status or invalid JSON structure
**Response**: HTTPException with status_code=502
**Recovery**:
- Log the error with full response details
- Return error to client
- Alert monitoring system for investigation

**Example**:
```python
if response.status_code != 200:
    raise HTTPException(
        status_code=502,
        detail=f"ML endpoint returned status {response.status_code}"
    )

required_keys = ["prediction", "confidence", "shap_values"]
if not all(key in result for key in required_keys):
    raise HTTPException(
        status_code=502,
        detail="ML endpoint returned invalid response structure"
    )
```

### Error Scenario 3: LLM API Failure

**Condition**: LangChain LLM call fails (rate limit, API error, timeout)
**Response**: HTTPException with status_code=500
**Recovery**:
- Return partial response with ML results but no explanation
- Or retry with exponential backoff
- Fallback to template-based explanation

**Example**:
```python
try:
    response = await chain.ainvoke({...})
except Exception as e:
    # Option 1: Return error
    raise HTTPException(
        status_code=500,
        detail=f"Failed to generate explanation: {str(e)}"
    )
    
    # Option 2: Return fallback explanation
    explanation = f"Prediction: {prediction} with {confidence:.2%} confidence. " \
                  f"Top features: {', '.join(list(shap_values.keys())[:3])}"
```

### Error Scenario 4: Invalid Request Data

**Condition**: Client sends empty input_text or malformed extra_features
**Response**: HTTPException with status_code=422 (automatically handled by FastAPI/Pydantic)
**Recovery**:
- FastAPI returns validation error details
- Client fixes request and retries

**Example**:
```python
# Pydantic automatically validates
class PredictRequest(BaseModel):
    input_text: str = Field(..., min_length=1)  # Ensures non-empty
    extra_features: Optional[Dict[str, Any]] = None

# FastAPI returns 422 with details:
# {
#   "detail": [
#     {
#       "loc": ["body", "input_text"],
#       "msg": "ensure this value has at least 1 characters",
#       "type": "value_error.any_str.min_length"
#     }
#   ]
# }
```

### Error Scenario 5: Missing Environment Configuration

**Condition**: Required environment variables not set (ML_ENDPOINT_URL, LLM API keys)
**Response**: HTTPException with status_code=500 or startup failure
**Recovery**:
- Check environment configuration on startup
- Fail fast with clear error message
- Document required environment variables

**Example**:
```python
# In main.py startup
@app.on_event("startup")
async def validate_config():
    """Validate required environment variables on startup"""
    required_vars = ["ML_ENDPOINT_URL"]
    missing = [var for var in required_vars if not os.getenv(var)]
    
    if missing:
        raise RuntimeError(
            f"Missing required environment variables: {', '.join(missing)}"
        )
    
    # Check at least one LLM API key
    if not (os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")):
        raise RuntimeError(
            "No LLM API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY"
        )
```

## Testing Strategy

### Unit Testing Approach

**Scope**: Test individual functions in isolation with mocked dependencies

**Key Test Cases**:

1. **ML Service Tests** (test_ml_service.py):
   - Test successful ML endpoint call with valid response
   - Test connection error handling (503)
   - Test bad response handling (502)
   - Test timeout handling
   - Test Bearer token inclusion when ML_API_KEY is set
   - Test request payload formatting with/without extra_features

2. **RAG Service Tests** (test_rag_service.py):
   - Test SHAP value sorting by absolute value
   - Test top-10 feature selection
   - Test prompt template formatting
   - Test LLM initialization with different API keys
   - Test async chain invocation
   - Test explanation text extraction

3. **Main API Tests** (test_main.py):
   - Test /predict endpoint with valid request
   - Test /health endpoint
   - Test request validation (empty input_text)
   - Test CORS headers
   - Test sequential service invocation
   - Test response model validation

**Testing Tools**:
- pytest for test framework
- pytest-asyncio for async test support
- httpx for HTTP client testing
- unittest.mock for mocking external dependencies

**Example Unit Test**:
```python
# test_ml_service.py
import pytest
from unittest.mock import patch, AsyncMock
from ml_service import call_ml_model
from fastapi import HTTPException

@pytest.mark.asyncio
async def test_call_ml_model_success():
    """Test successful ML model call"""
    mock_response = AsyncMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "prediction": "positive",
        "confidence": 0.85,
        "shap_values": {"feature1": 0.5, "feature2": -0.3}
    }
    
    with patch('httpx.AsyncClient.post', return_value=mock_response):
        result = await call_ml_model("test input")
        
        assert result["prediction"] == "positive"
        assert result["confidence"] == 0.85
        assert len(result["shap_values"]) == 2

@pytest.mark.asyncio
async def test_call_ml_model_connection_error():
    """Test connection error returns 503"""
    with patch('httpx.AsyncClient.post', side_effect=httpx.ConnectError("Connection failed")):
        with pytest.raises(HTTPException) as exc_info:
            await call_ml_model("test input")
        
        assert exc_info.value.status_code == 503
        assert "Failed to connect" in exc_info.value.detail
```

### Property-Based Testing Approach

**Scope**: Test universal properties that should hold for all inputs

**Property Test Library**: Hypothesis (Python)

**Key Properties to Test**:

1. **SHAP Sorting Property**: Top-K SHAP features are always sorted by absolute value
2. **Response Completeness Property**: All response fields are always populated
3. **Input Immutability Property**: Input data is never mutated
4. **Confidence Range Property**: Confidence is always between 0.0 and 1.0
5. **Idempotency Property**: Same input produces same output (when ML/LLM are mocked)

**Example Property Test**:
```python
# test_properties.py
from hypothesis import given, strategies as st
import pytest

@given(
    shap_values=st.dictionaries(
        keys=st.text(min_size=1, max_size=20),
        values=st.floats(min_value=-100, max_value=100, allow_nan=False),
        min_size=1,
        max_size=50
    )
)
def test_shap_sorting_property(shap_values):
    """Property: Top-K SHAP features are sorted by absolute value (descending)"""
    # Sort by absolute value
    sorted_shap = sorted(
        shap_values.items(),
        key=lambda x: abs(x[1]),
        reverse=True
    )
    top_10 = sorted_shap[:10]
    
    # Verify descending order by absolute value
    for i in range(len(top_10) - 1):
        assert abs(top_10[i][1]) >= abs(top_10[i + 1][1]), \
            f"SHAP values not sorted: {abs(top_10[i][1])} < {abs(top_10[i + 1][1])}"

@given(
    input_text=st.text(min_size=1, max_size=1000),
    extra_features=st.one_of(
        st.none(),
        st.dictionaries(
            keys=st.text(min_size=1),
            values=st.one_of(st.floats(), st.integers(), st.text())
        )
    )
)
@pytest.mark.asyncio
async def test_input_immutability_property(input_text, extra_features):
    """Property: Input data is never mutated during processing"""
    import copy
    from main import PredictRequest
    
    request = PredictRequest(
        input_text=input_text,
        extra_features=extra_features
    )
    
    original_input_text = copy.deepcopy(request.input_text)
    original_extra_features = copy.deepcopy(request.extra_features)
    
    # Mock services to avoid external calls
    with patch('ml_service.call_ml_model', return_value={
        "prediction": "test",
        "confidence": 0.5,
        "shap_values": {"f1": 0.1}
    }):
        with patch('rag_service.explain_with_rag', return_value="explanation"):
            await predict(request)
    
    assert request.input_text == original_input_text
    assert request.extra_features == original_extra_features
```

### Integration Testing Approach

**Scope**: Test complete workflow with real services (or realistic mocks)

**Key Integration Tests**:

1. **End-to-End Prediction Flow**:
   - Start FastAPI test server
   - Mock ML endpoint with realistic responses
   - Mock LLM with realistic explanations
   - Send HTTP request to /predict
   - Verify complete response structure

2. **CORS Integration**:
   - Test CORS headers are set correctly
   - Test preflight OPTIONS requests
   - Verify frontend_url from environment

3. **Error Propagation**:
   - Test ML service errors propagate correctly
   - Test RAG service errors propagate correctly
   - Verify appropriate HTTP status codes

**Example Integration Test**:
```python
# test_integration.py
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_end_to_end_prediction(client):
    """Test complete prediction workflow"""
    # Mock ML service
    mock_ml_result = {
        "prediction": "positive_sentiment",
        "confidence": 0.87,
        "shap_values": {
            "word_excellent": 0.45,
            "word_quality": 0.32,
            "word_slow": -0.28,
            "sentiment_score": 0.15
        }
    }
    
    # Mock RAG service
    mock_explanation = """
    The model predicts positive sentiment with 87% confidence.
    
    Key factors:
    - "excellent" and "quality" strongly indicate positive sentiment
    - "slow" has negative impact but is outweighed by positive terms
    
    Recommendation: Address delivery speed to improve overall satisfaction.
    """
    
    with patch('ml_service.call_ml_model', return_value=mock_ml_result):
        with patch('rag_service.explain_with_rag', return_value=mock_explanation):
            response = client.post(
                "/predict",
                json={
                    "input_text": "The product quality is excellent but delivery was slow",
                    "extra_features": {"customer_segment": "premium"}
                }
            )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["prediction"] == "positive_sentiment"
    assert data["confidence"] == 0.87
    assert len(data["shap_values"]) == 4
    assert "excellent" in data["explanation"]
    assert "delivery speed" in data["explanation"]

def test_cors_headers(client):
    """Test CORS headers are set correctly"""
    with patch.dict('os.environ', {'FRONTEND_URL': 'http://localhost:3000'}):
        response = client.options("/predict")
        
        assert "access-control-allow-origin" in response.headers
        assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
```

## Performance Considerations

### Async I/O Optimization

**Strategy**: Use async/await throughout to avoid blocking operations

**Implementation**:
- httpx.AsyncClient for ML endpoint calls (non-blocking HTTP)
- LangChain chain.ainvoke() for LLM calls (async)
- FastAPI native async support for concurrent request handling

**Expected Performance**:
- Multiple concurrent requests can be handled without blocking
- I/O-bound operations (HTTP, LLM) don't block CPU
- Typical response time: 500ms-2s (depends on ML endpoint and LLM latency)

### Timeout Configuration

**ML Endpoint Timeout**: 30 seconds
```python
async with httpx.AsyncClient(timeout=30.0) as client:
    response = await client.post(...)
```

**LLM Timeout**: Configured in LangChain LLM initialization
```python
ChatOpenAI(model="gpt-4o-mini", temperature=0.7, timeout=30)
```

**Rationale**: Balance between allowing sufficient time for processing and preventing hung requests

### Caching Considerations

**Not Implemented in MVP**: Caching adds complexity and requires cache invalidation strategy

**Future Enhancement**: Consider caching for:
- Identical input_text + extra_features → cache ML results
- Identical ML results → cache RAG explanations
- Use Redis or in-memory LRU cache
- Set TTL based on ML model update frequency

### Connection Pooling

**httpx.AsyncClient**: Automatically manages connection pooling
- Reuses TCP connections for multiple requests
- Reduces connection overhead

**Best Practice**: Use context manager to ensure proper cleanup
```python
async with httpx.AsyncClient() as client:
    # Connection is reused within this context
    response = await client.post(...)
```

## Security Considerations

### API Key Management

**Environment Variables**: All sensitive keys stored in .env file
- ML_API_KEY: Bearer token for ML endpoint
- OPENAI_API_KEY or ANTHROPIC_API_KEY: LLM API keys

**Best Practices**:
- Never commit .env file to version control (add to .gitignore)
- Use secrets management service in production (AWS Secrets Manager, HashiCorp Vault)
- Rotate API keys regularly
- Use least-privilege access for ML endpoint

### CORS Configuration

**Strict Origin Control**: Only allow requests from configured frontend URL
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],  # Specific origin, not "*"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Production Considerations**:
- Use specific methods instead of "*" (e.g., ["GET", "POST"])
- Limit allowed headers to required ones
- Consider rate limiting per origin

### Input Validation

**Pydantic Models**: Automatic validation of request data
- Type checking (str, dict, float)
- Range validation (confidence between 0.0 and 1.0)
- Required field enforcement

**Additional Validation**:
```python
class PredictRequest(BaseModel):
    input_text: str = Field(..., min_length=1, max_length=10000)  # Prevent huge inputs
    extra_features: Optional[Dict[str, Any]] = None
    
    @validator('input_text')
    def sanitize_input(cls, v):
        # Remove potentially harmful characters if needed
        return v.strip()
```

### HTTPS/TLS

**Production Requirement**: Always use HTTPS in production
- Protects API keys in transit
- Prevents man-in-the-middle attacks
- Use reverse proxy (nginx, Traefik) or cloud load balancer for TLS termination

### Rate Limiting

**Not Implemented in MVP**: Consider adding for production

**Recommended Approach**:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/predict")
@limiter.limit("10/minute")  # 10 requests per minute per IP
async def predict(request: PredictRequest):
    ...
```

### Error Message Sanitization

**Avoid Leaking Sensitive Information**: Don't expose internal details in error messages

**Example**:
```python
# Bad: Exposes internal URL
raise HTTPException(status_code=503, detail=f"Failed to connect to {ml_endpoint_url}")

# Good: Generic message
raise HTTPException(status_code=503, detail="ML service temporarily unavailable")
```

## Dependencies

### Core Dependencies

```python
# requirements.txt
fastapi==0.109.0          # Web framework
uvicorn[standard]==0.27.0 # ASGI server
pydantic==2.5.0           # Data validation
python-dotenv==1.0.0      # Environment variable loading
httpx==0.26.0             # Async HTTP client

# LangChain dependencies
langchain==0.1.0          # LangChain core
langchain-openai==0.0.2   # OpenAI integration
langchain-anthropic==0.0.1 # Anthropic integration (optional)

# Testing dependencies (dev)
pytest==7.4.0
pytest-asyncio==0.21.0
hypothesis==6.92.0
```

### Environment Variables

```bash
# .env.example
# ML Service Configuration
ML_ENDPOINT_URL=https://api.example.com/ml/predict
ML_API_KEY=your_ml_api_key_here  # Optional Bearer token

# LLM Configuration (choose one or both)
OPENAI_API_KEY=sk-your-openai-key-here
# ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### System Requirements

- Python 3.9 or higher
- pip or poetry for dependency management
- Virtual environment recommended (venv, conda, poetry)

### Installation Commands

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
# Edit .env with your actual API keys

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Docker Support (Optional)

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    env_file:
      - .env
    volumes:
      - ./backend:/app
    command: uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
