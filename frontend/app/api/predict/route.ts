

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEV_BACKEND_URL = 'http://localhost:8000';

function resolveBackendUrl(): string | null {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/$/, '');
  }

  if (process.env.NODE_ENV === 'development') {
    return DEV_BACKEND_URL;
  }

  return null;
}

async function tryParseJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const backendUrl = resolveBackendUrl();
  if (!backendUrl) {
    const detail = 'BACKEND_URL is not configured on the server';
    return NextResponse.json({ detail, error: detail }, { status: 500 });
  }

  try {
    const body = await request.json();

    // Forward request to FastAPI backend
    const response = await fetch(`${backendUrl}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(30000),
    });

    const payload = await tryParseJson(response);

    if (!response.ok) {
      const detail =
        (payload?.detail as string | undefined) ||
        (payload?.error as string | undefined) ||
        'Prediction failed';

      return NextResponse.json(
        { detail, error: detail },
        { status: response.status }
      );
    }

    if (!payload) {
      const detail = 'Backend returned an invalid response payload';
      return NextResponse.json({ detail, error: detail }, { status: 502 });
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Prediction API error:', error);

    const isTimeout =
      error instanceof Error &&
      (error.name === 'TimeoutError' || error.name === 'AbortError');
    const status = isTimeout ? 504 : 500;
    const detail = isTimeout ? 'Backend request timed out' : 'Internal server error';

    return NextResponse.json(
      { detail, error: detail },
      { status }
    );
  }
}
