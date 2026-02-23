"""
ML Service Module
Handles communication with the cloud-hosted ML model endpoint
"""

import httpx
import os
from typing import Dict, Any, Optional
from fastapi import HTTPException


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
    # ขั้นตอนที่ 1: โหลดค่า config จาก environment
    # Step 1: Load configuration from environment
    ml_endpoint_url = os.getenv("ML_ENDPOINT_URL")
    ml_api_key = os.getenv("ML_API_KEY")
    
    # ตรวจสอบว่า ML_ENDPOINT_URL ถูกตั้งค่าหรือไม่
    # Validate ML_ENDPOINT_URL is set
    if not ml_endpoint_url:
        raise HTTPException(
            status_code=500, 
            detail="ML_ENDPOINT_URL not configured"
        )
    
    # ขั้นตอนที่ 2: เตรียม request payload
    # Step 2: Prepare request payload
    payload = {
        "input_text": input_text
    }
    if extra_features:
        payload["extra_features"] = extra_features
    
    # ขั้นตอนที่ 3: เตรียม headers พร้อม Bearer token (ถ้ามี)
    # Step 3: Prepare headers with optional Bearer token
    headers = {"Content-Type": "application/json"}
    if ml_api_key:
        headers["Authorization"] = f"Bearer {ml_api_key}"
    
    # ขั้นตอนที่ 4-6: ส่ง HTTP request และจัดการ response
    # Steps 4-6: Make HTTP request and handle response
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                ml_endpoint_url,
                json=payload,
                headers=headers
            )
            
            # ตรวจสอบ status code ของ response
            # Validate response status code
            if response.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"ML endpoint returned status {response.status_code}"
                )
            
            # แปลงและตรวจสอบโครงสร้างของ response
            # Parse and validate response structure
            result = response.json()
            
            required_keys = ["prediction", "confidence", "shap_values"]
            if not all(key in result for key in required_keys):
                raise HTTPException(
                    status_code=502,
                    detail="ML endpoint returned invalid response structure"
                )
            
            return result
    
    except httpx.ConnectError as e:
        # จัดการกรณีเชื่อมต่อไม่สำเร็จ
        # Handle connection failure
        raise HTTPException(
            status_code=503,
            detail=f"Failed to connect to ML endpoint: {str(e)}"
        )
    except httpx.TimeoutException as e:
        # จัดการกรณี timeout
        # Handle timeout
        raise HTTPException(
            status_code=503,
            detail=f"ML endpoint timeout: {str(e)}"
        )
    except HTTPException:
        # ส่งต่อ HTTPException ที่เกิดขึ้นแล้ว
        # Re-raise HTTPException that was already raised
        raise
    except Exception as e:
        # จัดการ error อื่นๆ ที่ไม่คาดคิด
        # Handle other unexpected errors
        raise HTTPException(
            status_code=502,
            detail=f"Unexpected error calling ML endpoint: {str(e)}"
        )
