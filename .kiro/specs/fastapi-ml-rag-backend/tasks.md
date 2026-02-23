# Tasks: FastAPI ML-RAG Backend

## Phase 1: Project Setup

- [x] 1.1 Create project structure
  - [x] 1.1.1 Create backend/ directory
  - [x] 1.1.2 Create backend/main.py
  - [x] 1.1.3 Create backend/ml_service.py
  - [x] 1.1.4 Create backend/rag_service.py
  - [x] 1.1.5 Create backend/.env.example
  - [x] 1.1.6 Create backend/.gitignore (include .env)

- [x] 1.2 Set up Python environment
  - [x] 1.2.1 Create requirements.txt with all dependencies
  - [x] 1.2.2 Create virtual environment
  - [x] 1.2.3 Install dependencies from requirements.txt

- [x] 1.3 Configure environment variables
  - [x] 1.3.1 Copy .env.example to .env
  - [x] 1.3.2 Add ML_ENDPOINT_URL to .env
  - [x] 1.3.3 Add ML_API_KEY to .env (if required)
  - [x] 1.3.4 Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env
  - [x] 1.3.5 Add FRONTEND_URL to .env

## Phase 2: ML Service Implementation

- [x] 2.1 Implement call_ml_model() function
  - [x] 2.1.1 Import required libraries (httpx, os, typing)
  - [x] 2.1.2 Define async function signature
  - [x] 2.1.3 Load ML_ENDPOINT_URL and ML_API_KEY from environment
  - [x] 2.1.4 Validate ML_ENDPOINT_URL is set
  - [x] 2.1.5 Prepare request payload with input_text and extra_features
  - [x] 2.1.6 Prepare headers with Content-Type and optional Bearer token
  - [x] 2.1.7 Create httpx.AsyncClient with 30s timeout
  - [x] 2.1.8 Make POST request to ML endpoint
  - [x] 2.1.9 Validate response status code (200)
  - [x] 2.1.10 Parse JSON response
  - [x] 2.1.11 Validate response structure (prediction, confidence, shap_values keys)
  - [x] 2.1.12 Handle httpx.ConnectError → HTTPException(503)
  - [x] 2.1.13 Handle httpx.TimeoutException → HTTPException(503)
  - [x] 2.1.14 Handle non-200 status → HTTPException(502)
  - [x] 2.1.15 Handle invalid response structure → HTTPException(502)
  - [x] 2.1.16 Return result dict
  - [x] 2.1.17 Add Thai comments for non-obvious logic

## Phase 3: RAG Service Implementation

- [x] 3.1 Implement explain_with_rag() function
  - [x] 3.1.1 Import required libraries (langchain, os, typing)
  - [x] 3.1.2 Define async function signature
  - [x] 3.1.3 Sort shap_values by absolute value (descending)
  - [x] 3.1.4 Select top 10 features
  - [x] 3.1.5 Format SHAP features into readable text lines
  - [x] 3.1.6 Join formatted lines with newlines
  - [x] 3.1.7 Create PromptTemplate with input_variables
  - [x] 3.1.8 Define template text covering prediction, SHAP, recommendations
  - [x] 3.1.9 Call _initialize_llm() helper function
  - [x] 3.1.10 Create chain using PromptTemplate | LLM
  - [x] 3.1.11 Invoke chain with ainvoke() passing all variables
  - [x] 3.1.12 Extract text from response (handle different response formats)
  - [x] 3.1.13 Return explanation string
  - [x] 3.1.14 Add Thai comments for non-obvious logic

- [x] 3.2 Implement _initialize_llm() helper function
  - [x] 3.2.1 Import ChatOpenAI and ChatAnthropic
  - [x] 3.2.2 Check for OPENAI_API_KEY in environment
  - [x] 3.2.3 If OpenAI key exists, return ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
  - [x] 3.2.4 Check for ANTHROPIC_API_KEY in environment
  - [x] 3.2.5 If Anthropic key exists, return ChatAnthropic(model="claude-3-haiku-20240307", temperature=0.7)
  - [x] 3.2.6 If no keys found, raise ValueError with descriptive message

## Phase 4: FastAPI Application Implementation

- [x] 4.1 Define Pydantic models
  - [x] 4.1.1 Create PredictRequest model with input_text and extra_features
  - [x] 4.1.2 Add Field validation for input_text (min_length=1)
  - [x] 4.1.3 Create PredictResponse model with all required fields
  - [x] 4.1.4 Add Field validation for confidence (ge=0.0, le=1.0)

- [x] 4.2 Initialize FastAPI application
  - [x] 4.2.1 Import FastAPI, HTTPException, CORSMiddleware
  - [x] 4.2.2 Import python-dotenv and load_dotenv
  - [x] 4.2.3 Call load_dotenv() to load .env file
  - [x] 4.2.4 Create FastAPI app instance with title and version
  - [x] 4.2.5 Load FRONTEND_URL from environment (default: http://localhost:3000)
  - [x] 4.2.6 Add CORSMiddleware with specific origin from FRONTEND_URL
  - [x] 4.2.7 Import call_ml_model from ml_service
  - [x] 4.2.8 Import explain_with_rag from rag_service

- [x] 4.3 Implement /predict endpoint
  - [x] 4.3.1 Define async function with @app.post decorator
  - [x] 4.3.2 Set response_model=PredictResponse
  - [x] 4.3.3 Accept PredictRequest parameter
  - [x] 4.3.4 Call await call_ml_model() with input_text and extra_features
  - [x] 4.3.5 Extract prediction, confidence, shap_values from ml_result
  - [x] 4.3.6 Call await explain_with_rag() with all parameters
  - [x] 4.3.7 Create and return PredictResponse with all fields
  - [x] 4.3.8 Let HTTPExceptions propagate naturally

- [x] 4.4 Implement /health endpoint
  - [x] 4.4.1 Define async function with @app.get decorator
  - [x] 4.4.2 Return dict with "status": "healthy"

- [x] 4.5 Add startup validation
  - [x] 4.5.1 Create @app.on_event("startup") handler
  - [x] 4.5.2 Validate ML_ENDPOINT_URL is set
  - [x] 4.5.3 Validate at least one LLM API key is set
  - [x] 4.5.4 Raise RuntimeError with clear message if validation fails

## Phase 5: Testing Implementation

- [x] 5.1 Create test structure
  - [x] 5.1.1 Create backend/tests/ directory
  - [x] 5.1.2 Create backend/tests/__init__.py
  - [x] 5.1.3 Create backend/tests/test_ml_service.py
  - [x] 5.1.4 Create backend/tests/test_rag_service.py
  - [x] 5.1.5 Create backend/tests/test_main.py
  - [x] 5.1.6 Create backend/tests/test_properties.py
  - [x] 5.1.7 Create backend/tests/test_integration.py
  - [x] 5.1.8 Create backend/pytest.ini

- [x] 5.2 Write ML service unit tests
  - [x] 5.2.1 Test successful ML endpoint call
  - [x] 5.2.2 Test Bearer token inclusion when ML_API_KEY is set
  - [x] 5.2.3 Test Bearer token omission when ML_API_KEY is not set
  - [x] 5.2.4 Test connection error handling (503)
  - [x] 5.2.5 Test timeout error handling (503)
  - [x] 5.2.6 Test non-200 response handling (502)
  - [x] 5.2.7 Test invalid response structure handling (502)
  - [x] 5.2.8 Test missing ML_ENDPOINT_URL handling (500)

- [x] 5.3 Write RAG service unit tests
  - [x] 5.3.1 Test SHAP value sorting by absolute value
  - [x] 5.3.2 Test top-10 feature selection
  - [x] 5.3.3 Test SHAP feature formatting
  - [x] 5.3.4 Test LLM initialization with OpenAI key
  - [x] 5.3.5 Test LLM initialization with Anthropic key
  - [x] 5.3.6 Test LLM initialization failure with no keys
  - [x] 5.3.7 Test chain invocation with ainvoke
  - [x] 5.3.8 Test explanation text extraction

- [x] 5.4 Write FastAPI application unit tests
  - [x] 5.4.1 Test /predict endpoint with valid request
  - [x] 5.4.2 Test /predict endpoint with empty input_text (422)
  - [x] 5.4.3 Test /predict endpoint sequential service calls
  - [x] 5.4.4 Test /health endpoint
  - [x] 5.4.5 Test CORS headers
  - [x] 5.4.6 Test startup validation with missing config

- [x] 5.5 Write property-based tests
  - [x] 5.5.1 Test SHAP sorting property (descending by absolute value)
  - [x] 5.5.2 Test input immutability property
  - [x] 5.5.3 Test response completeness property
  - [x] 5.5.4 Test confidence range property (0.0 to 1.0)

- [x] 5.6 Write integration tests
  - [x] 5.6.1 Test end-to-end prediction workflow
  - [x] 5.6.2 Test CORS integration
  - [x] 5.6.3 Test error propagation from ML service
  - [x] 5.6.4 Test error propagation from RAG service

## Phase 6: Documentation and Deployment

- [x] 6.1 Create documentation
  - [x] 6.1.1 Create backend/README.md with setup instructions
  - [x] 6.1.2 Document environment variables in README
  - [x] 6.1.3 Document API endpoints with examples
  - [x] 6.1.4 Document testing commands
  - [x] 6.1.5 Add architecture diagram to README

- [x] 6.2 Create deployment files (optional)
  - [x] 6.2.1 Create Dockerfile
  - [x] 6.2.2 Create docker-compose.yml
  - [x] 6.2.3 Test Docker build and run

- [x] 6.3 Verify complete system
  - [x] 6.3.1 Run all unit tests (pytest)
  - [x] 6.3.2 Run all property tests
  - [x] 6.3.3 Run all integration tests
  - [x] 6.3.4 Verify test coverage is at least 80%
  - [x] 6.3.5 Start development server (uvicorn main:app --reload)
  - [x] 6.3.6 Test /health endpoint manually
  - [x] 6.3.7 Test /predict endpoint manually with sample data
  - [x] 6.3.8 Verify CORS headers in browser
  - [x] 6.3.9 Verify error handling with invalid inputs
  - [x] 6.3.10 Review all Thai comments for clarity
