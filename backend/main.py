"""
FastAPI ML-RAG Backend - Main Application
Entry point for the API, handles HTTP routing, CORS, and orchestrates calls to ML and RAG services
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

async def validate_configuration():
    """
    Validate required environment variables on startup
    ตรวจสอบค่า environment variables ที่จำเป็นตอนเริ่มต้น
    """
    # Validate ML_ENDPOINT_URL is set
    ml_endpoint_url = os.getenv("ML_ENDPOINT_URL")
    if not ml_endpoint_url:
        raise RuntimeError(
            "ML_ENDPOINT_URL environment variable is not set. "
            "Please configure the ML endpoint URL in your .env file."
        )
    
    # Validate at least one LLM API key is set
    openai_key = os.getenv("OPENAI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not openai_key and not anthropic_key:
        raise RuntimeError(
            "No LLM API key configured. "
            "Please set either OPENAI_API_KEY or ANTHROPIC_API_KEY in your .env file."
        )


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Application lifespan hook to validate environment at startup."""
    await validate_configuration()
    yield


app = FastAPI(title="ML-RAG Backend", version="1.0.0", lifespan=lifespan)

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


# Pydantic models
class PredictRequest(BaseModel):
    input_text: str = Field(..., min_length=1, description="Text input for ML model")
    extra_features: Optional[Dict[str, Any]] = Field(
        None, 
        description="Optional additional features for the model"
    )


class PredictResponse(BaseModel):
    prediction: Any = Field(..., description="Model prediction result")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    shap_values: Dict[str, float] = Field(..., description="SHAP feature importance values")
    explanation: str = Field(..., description="Natural language explanation from RAG")


# Endpoints
@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest) -> PredictResponse:
    """Main prediction endpoint that orchestrates ML and RAG services"""
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


@app.get("/health")
async def health() -> Dict[str, str]:
    """Health check endpoint"""
    return {"status": "healthy"}
