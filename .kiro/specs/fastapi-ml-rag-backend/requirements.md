# Requirements Document: FastAPI ML-RAG Backend

## 1. Functional Requirements

### 1.1 ML Service Integration

The system shall provide an async function `call_ml_model()` that:
- Accepts `input_text` (string) and optional `extra_features` (dict) as parameters
- Reads ML endpoint URL from `ML_ENDPOINT_URL` environment variable
- Sends POST request to ML endpoint with JSON payload containing input_text and extra_features
- Includes Bearer token authentication using `ML_API_KEY` environment variable if present
- Returns dict containing `prediction`, `confidence` (float), and `shap_values` (dict of feature names to float values)
- Raises HTTPException with status 502 for non-200 responses or invalid response structure
- Raises HTTPException with status 503 for connection failures or timeouts
- Uses httpx.AsyncClient for non-blocking HTTP requests
- Sets request timeout to 30 seconds

### 1.2 RAG Service Integration

The system shall provide an async function `explain_with_rag()` that:
- Accepts `input_text` (string), `prediction` (any), `confidence` (float), and `shap_values` (dict) as parameters
- Sorts SHAP values by absolute value in descending order
- Selects top 10 SHAP features
- Formats SHAP features into readable text with feature names, values, and impact direction
- Creates LangChain PromptTemplate with placeholders for input_text, prediction, confidence, and formatted SHAP features
- Initializes LLM from environment variables (defaults to OpenAI gpt-4o-mini if OPENAI_API_KEY is set)
- Supports fallback to Anthropic Claude if ANTHROPIC_API_KEY is set and OpenAI key is not available
- Builds LangChain chain using PromptTemplate | LLM pattern
- Invokes chain asynchronously using `ainvoke()` method
- Returns explanation as plain string
- Generates explanation covering: (1) prediction meaning, (2) SHAP features impact, (3) recommendations

### 1.3 FastAPI Application

The system shall provide a FastAPI application that:
- Exposes POST `/predict` endpoint accepting PredictRequest (input_text, optional extra_features)
- Returns PredictResponse containing prediction, confidence, shap_values, and explanation
- Calls `call_ml_model()` first, then `explain_with_rag()` sequentially
- Exposes GET `/health` endpoint returning status dict
- Configures CORS middleware using `FRONTEND_URL` environment variable
- Loads environment variables using python-dotenv
- Validates requests using Pydantic models
- Returns appropriate HTTP status codes for different error scenarios

### 1.4 Data Validation

The system shall validate:
- `input_text` is non-empty string (min_length=1)
- `extra_features` is None or valid dict
- `confidence` is float between 0.0 and 1.0
- `shap_values` is dict with string keys and float values
- All required fields are present in responses

## 2. Non-Functional Requirements

### 2.1 Performance

- All I/O operations shall use async/await patterns
- HTTP requests shall not block other concurrent requests
- ML endpoint timeout shall be 30 seconds
- LLM timeout shall be 30 seconds
- System shall handle multiple concurrent requests without blocking

### 2.2 Reliability

- System shall handle ML endpoint failures gracefully with appropriate error codes
- System shall handle LLM API failures gracefully
- System shall validate environment configuration on startup
- System shall properly close HTTP connections using context managers

### 2.3 Security

- API keys shall be stored in environment variables, never hardcoded
- CORS shall be configured with specific origin from FRONTEND_URL, not wildcard
- Bearer token authentication shall be used for ML endpoint if ML_API_KEY is provided
- Input validation shall prevent empty or malformed requests
- Error messages shall not expose sensitive internal details

### 2.4 Maintainability

- ML service logic shall be separated in `ml_service.py`
- RAG service logic shall be separated in `rag_service.py`
- Main application logic shall be in `main.py`
- Each service file shall be independently importable
- ML and RAG logic shall not be mixed
- Thai comments shall be added where logic is non-obvious

### 2.5 Testability

- All functions shall be async and mockable
- Services shall be independently testable
- Unit tests shall cover individual functions with mocked dependencies
- Property-based tests shall verify universal properties
- Integration tests shall verify end-to-end workflows

## 3. Interface Requirements

### 3.1 HTTP API Interface

**POST /predict**
- Request Body: `{"input_text": string, "extra_features": object | null}`
- Response Body: `{"prediction": any, "confidence": float, "shap_values": object, "explanation": string}`
- Success Status: 200
- Error Status: 422 (validation), 500 (internal), 502 (bad gateway), 503 (service unavailable)

**GET /health**
- Response Body: `{"status": string}`
- Success Status: 200

### 3.2 ML Endpoint Interface

**Expected Request Format**:
```json
{
  "input_text": "string",
  "extra_features": {
    "feature1": "value1",
    "feature2": "value2"
  }
}
```

**Expected Response Format**:
```json
{
  "prediction": "any",
  "confidence": 0.85,
  "shap_values": {
    "feature1": 0.45,
    "feature2": -0.32
  }
}
```

### 3.3 Environment Variables Interface

Required:
- `ML_ENDPOINT_URL`: URL of cloud ML endpoint
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`: LLM API key

Optional:
- `ML_API_KEY`: Bearer token for ML endpoint authentication
- `FRONTEND_URL`: Frontend origin for CORS (defaults to http://localhost:3000)

## 4. Constraints

### 4.1 Technical Constraints

- Python 3.9 or higher required
- Must use FastAPI framework
- Must use httpx.AsyncClient for HTTP requests (not requests library)
- Must use LangChain for RAG pipeline
- Must use async/await throughout (no blocking calls)
- Must use Pydantic for data validation
- Must use python-dotenv for environment variable loading

### 4.2 Architectural Constraints

- Services must be separated into distinct files (main.py, ml_service.py, rag_service.py)
- ML and RAG logic must not be mixed
- Each service file must be independently importable
- Sequential execution: ML model must be called before RAG explanation

### 4.3 Operational Constraints

- Environment variables must be loaded from .env file
- .env file must not be committed to version control
- Application must validate configuration on startup
- Application must fail fast with clear error messages if configuration is invalid

## 5. Acceptance Criteria

### 5.1 ML Service Acceptance Criteria

- [ ] `call_ml_model()` successfully calls ML endpoint with valid input
- [ ] Bearer token is included in Authorization header when ML_API_KEY is set
- [ ] Bearer token is not included when ML_API_KEY is not set
- [ ] Returns dict with prediction, confidence, and shap_values keys
- [ ] Raises HTTPException(503) on connection failure
- [ ] Raises HTTPException(502) on non-200 response
- [ ] Raises HTTPException(502) on invalid response structure
- [ ] Uses httpx.AsyncClient (not requests)
- [ ] Request timeout is 30 seconds
- [ ] HTTP connection is properly closed

### 5.2 RAG Service Acceptance Criteria

- [ ] `explain_with_rag()` sorts SHAP values by absolute value
- [ ] Selects top 10 SHAP features
- [ ] Formats SHAP features with feature name, value, and direction
- [ ] Creates LangChain PromptTemplate with correct placeholders
- [ ] Initializes OpenAI LLM when OPENAI_API_KEY is set
- [ ] Initializes Anthropic LLM when only ANTHROPIC_API_KEY is set
- [ ] Uses gpt-4o-mini model by default for OpenAI
- [ ] Invokes chain using ainvoke() (async)
- [ ] Returns explanation as plain string
- [ ] Explanation covers prediction meaning, SHAP impact, and recommendations

### 5.3 FastAPI Application Acceptance Criteria

- [ ] POST /predict endpoint accepts PredictRequest
- [ ] POST /predict returns PredictResponse with all required fields
- [ ] POST /predict calls call_ml_model() before explain_with_rag()
- [ ] GET /health endpoint returns status dict
- [ ] CORS middleware is configured with FRONTEND_URL
- [ ] Environment variables are loaded using python-dotenv
- [ ] Pydantic validates input_text is non-empty
- [ ] Pydantic validates confidence is between 0.0 and 1.0
- [ ] Returns 422 for validation errors
- [ ] Returns 500 for internal errors
- [ ] Returns 502 for ML endpoint bad responses
- [ ] Returns 503 for ML endpoint connection failures

### 5.4 File Structure Acceptance Criteria

- [ ] backend/main.py exists and contains FastAPI application
- [ ] backend/ml_service.py exists and contains call_ml_model()
- [ ] backend/rag_service.py exists and contains explain_with_rag()
- [ ] backend/.env exists with required environment variables
- [ ] ml_service.py is independently importable
- [ ] rag_service.py is independently importable
- [ ] ML and RAG logic are not mixed

### 5.5 Testing Acceptance Criteria

- [ ] Unit tests cover call_ml_model() with mocked httpx
- [ ] Unit tests cover explain_with_rag() with mocked LangChain
- [ ] Unit tests cover /predict endpoint with mocked services
- [ ] Property tests verify SHAP sorting by absolute value
- [ ] Property tests verify input immutability
- [ ] Integration tests verify end-to-end workflow
- [ ] All tests use pytest and pytest-asyncio
- [ ] Test coverage is at least 80%

## 6. Dependencies

### 6.1 Python Packages

Core:
- fastapi==0.109.0
- uvicorn[standard]==0.27.0
- pydantic==2.5.0
- python-dotenv==1.0.0
- httpx==0.26.0

LangChain:
- langchain==0.1.0
- langchain-openai==0.0.2
- langchain-anthropic==0.0.1

Testing:
- pytest==7.4.0
- pytest-asyncio==0.21.0
- hypothesis==6.92.0

### 6.2 External Services

- Cloud-hosted ML model endpoint (URL from ML_ENDPOINT_URL)
- OpenAI API (gpt-4o-mini) or Anthropic API (Claude)

### 6.3 System Requirements

- Python 3.9 or higher
- pip or poetry for dependency management
- Virtual environment (venv, conda, or poetry)
