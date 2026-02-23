# FastAPI ML-RAG Backend Specification

## Overview

This specification defines a FastAPI middleware service that orchestrates requests between a frontend client and two backend services: a cloud-hosted ML model endpoint and a LangChain RAG pipeline. The service provides a unified API for making predictions and generating natural language explanations.

## Specification Documents

### 1. Design Document (`design.md`)
Comprehensive technical design including:
- Architecture diagrams (Mermaid)
- Component interfaces and responsibilities
- Data models with validation rules
- Algorithmic pseudocode with formal specifications (preconditions, postconditions, loop invariants)
- Key functions with formal specifications
- Example usage and code samples
- Correctness properties
- Error handling strategies
- Testing strategy (unit, property-based, integration)
- Performance considerations
- Security considerations
- Dependencies and installation

### 2. Requirements Document (`requirements.md`)
Detailed requirements derived from the design:
- Functional requirements (ML service, RAG service, FastAPI application, data validation)
- Non-functional requirements (performance, reliability, security, maintainability, testability)
- Interface requirements (HTTP API, ML endpoint, environment variables)
- Constraints (technical, architectural, operational)
- Acceptance criteria (comprehensive checklist for each component)
- Dependencies (Python packages, external services, system requirements)

### 3. Tasks Document (`tasks.md`)
Implementation task breakdown:
- Phase 1: Project Setup (6 tasks)
- Phase 2: ML Service Implementation (17 subtasks)
- Phase 3: RAG Service Implementation (16 subtasks)
- Phase 4: FastAPI Application Implementation (20 subtasks)
- Phase 5: Testing Implementation (30 subtasks)
- Phase 6: Documentation and Deployment (13 subtasks)

Total: 102 granular implementation tasks

## Key Features

### Clean Architecture
- **Separation of Concerns**: ML logic in `ml_service.py`, RAG logic in `rag_service.py`, API in `main.py`
- **Independent Modules**: Each service file is independently importable and testable
- **No Logic Mixing**: ML and RAG concerns are completely separated

### Async/Await Throughout
- Non-blocking HTTP requests using `httpx.AsyncClient`
- Async LangChain invocation using `chain.ainvoke()`
- FastAPI native async support for concurrent request handling

### Robust Error Handling
- HTTPException(503) for connection failures
- HTTPException(502) for bad responses from ML endpoint
- HTTPException(422) for validation errors (automatic via Pydantic)
- HTTPException(500) for internal errors
- Startup validation for configuration

### Comprehensive Testing
- Unit tests with mocked dependencies
- Property-based tests using Hypothesis
- Integration tests for end-to-end workflows
- Target: 80%+ test coverage

### Security Best Practices
- Environment variable management with python-dotenv
- Specific CORS origin (not wildcard)
- Bearer token authentication for ML endpoint
- Input validation via Pydantic
- Sanitized error messages

## File Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── ml_service.py          # ML model endpoint integration
├── rag_service.py         # LangChain RAG pipeline
├── .env                   # Environment variables (not committed)
├── .env.example           # Environment variable template
├── .gitignore             # Git ignore rules
├── requirements.txt       # Python dependencies
├── README.md              # Setup and usage documentation
├── Dockerfile             # Docker container definition (optional)
├── docker-compose.yml     # Docker Compose config (optional)
└── tests/
    ├── __init__.py
    ├── test_ml_service.py
    ├── test_rag_service.py
    ├── test_main.py
    ├── test_properties.py
    └── test_integration.py
```

## Environment Variables

Required:
- `ML_ENDPOINT_URL`: Cloud ML REST endpoint URL
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`: LLM API key

Optional:
- `ML_API_KEY`: Bearer token for ML endpoint authentication
- `FRONTEND_URL`: Frontend origin for CORS (default: http://localhost:3000)

## API Endpoints

### POST /predict
Accepts text input and optional features, returns prediction with explanation.

**Request**:
```json
{
  "input_text": "Customer feedback: The product quality is excellent but delivery was slow",
  "extra_features": {
    "customer_segment": "premium",
    "order_value": 299.99
  }
}
```

**Response**:
```json
{
  "prediction": "positive_sentiment",
  "confidence": 0.87,
  "shap_values": {
    "word_excellent": 0.45,
    "word_quality": 0.32,
    "word_slow": -0.28,
    "sentiment_score": 0.15
  },
  "explanation": "The model predicts positive sentiment with 87% confidence..."
}
```

### GET /health
Health check endpoint.

**Response**:
```json
{
  "status": "healthy"
}
```

## Quick Start

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest
```

## Workflow Type

**Design-First**: This specification started with technical design, then derived requirements, then created implementation tasks.

## Specification Metadata

- **Feature Name**: fastapi-ml-rag-backend
- **Spec Type**: New Feature
- **Workflow**: Design-First
- **Spec ID**: 42c98aa9-f076-4fc8-8366-49a6846d2874
- **Design Artifacts**: Both High-Level (Diagrams & Interfaces) and Low-Level (Code-First with Python)
- **Language**: Python (FastAPI framework explicitly mentioned in requirements)

## Next Steps

1. Review the design document for technical accuracy
2. Validate requirements against business needs
3. Begin implementation following the tasks document
4. Execute tests as components are completed
5. Deploy to staging environment for integration testing
