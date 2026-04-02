# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a full-stack credit scoring application with two independent services:

```
frontend/   (Next.js 14, TypeScript, Bun)
    ↓ POST /api/predict (Next.js proxy route)
backend/    (FastAPI, Python)
    ├── ml_service.py   → Cloud ML endpoint (returns prediction + confidence + SHAP values)
    └── rag_service.py  → LangChain + LLM (returns natural language explanation)
```

**Frontend user flow**: CreditForm → ResultCard (local scoring) → AI Assistant screen (plans A/B/C + chat)

**Important**: The frontend has a *local* scoring algorithm in `frontend/utils/scoring.ts` that runs in-browser, independent of the backend. The backend is only called when the AI assistant/explanation feature is used. The Next.js API route at `app/api/predict/route.ts` proxies to the FastAPI backend via `BACKEND_URL` env var.

## Backend Commands

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Run dev server
uvicorn main:app --reload --port 8000

# Run tests (coverage enabled by default via pytest.ini)
pytest
pytest tests/test_main.py::test_predict_endpoint_success   # single test
pytest tests/test_ml_service.py                            # single file
pytest -m unit                                             # by marker
pytest -m "not integration"                                # skip integration
```

## Frontend Commands

```bash
cd frontend
bun install
bun dev          # dev server at http://localhost:3000
bun build
bun lint
```

## Environment Variables

**Backend** (`backend/.env`):
- `ML_ENDPOINT_URL` — required; cloud ML model endpoint URL
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` — at least one required
- `ML_API_KEY` — optional bearer token for ML endpoint
- `FRONTEND_URL` — defaults to `http://localhost:3000` (used for CORS)

**Frontend** (`frontend/.env.local`):
- `BACKEND_URL` — used by Next.js API proxy routes (server-side), defaults to `http://localhost:8000`
- `NEXT_PUBLIC_API_URL` — used if calling backend directly from client

The backend performs startup validation and will refuse to start if `ML_ENDPOINT_URL` and at least one LLM key are absent.

## Key Design Patterns

- **Backend services** (`ml_service.py`, `rag_service.py`) are pure async functions imported into `main.py`. The main orchestration is: call ML → extract results → call RAG → return unified response.
- **LLM fallback**: OpenAI (`gpt-4o-mini`) is used by default; Anthropic (`claude-3-haiku-20240307`) is used if `OPENAI_API_KEY` is absent.
- **Frontend data model**: All `CreditInput` fields (Sex, Salary, outstanding, overdue, etc.) are stored as strings and parsed only in `utils/scoring.ts`.
- **Test markers**: `unit`, `integration`, `property`, `slow` — use `-m` to filter. Integration tests hit live services; unit tests mock all external calls.
- **Thai comments** are used throughout the backend for non-obvious logic — this is intentional per project conventions.
