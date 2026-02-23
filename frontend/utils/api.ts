/**
 * API client for backend communication
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface PredictRequest {
  input_text: string;
  extra_features?: Record<string, any>;
}

export interface PredictResponse {
  prediction: any;
  confidence: number;
  shap_values: Record<string, number>;
  explanation: string;
}

export interface ApiError {
  detail: string;
}

/**
 * Call ML prediction endpoint
 */
export async function predictCredit(
  inputText: string,
  extraFeatures?: Record<string, any>
): Promise<PredictResponse> {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input_text: inputText,
      extra_features: extraFeatures,
    }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.detail || 'Failed to get prediction');
  }

  return response.json();
}

/**
 * Check backend health
 */
export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  
  if (!response.ok) {
    throw new Error('Backend is not healthy');
  }

  return response.json();
}
