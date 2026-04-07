import { NextResponse } from 'next/server';

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

export async function GET() {
  const backendUrl = resolveBackendUrl();
  if (!backendUrl) {
    const detail = 'BACKEND_URL is not configured on the server';
    return NextResponse.json(
      { status: 'unhealthy', backend: 'not_configured', detail, error: detail },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: 'unhealthy', backend: 'unreachable', detail: 'Backend health check failed' },
        { status: 503 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      status: 'healthy',
      backend: data.status,
    });
  } catch (error) {
    console.error('Health check error:', error);

    const isTimeout =
      error instanceof Error &&
      (error.name === 'TimeoutError' || error.name === 'AbortError');
    const detail = isTimeout ? 'Backend health check timed out' : 'Backend health check failed';

    return NextResponse.json(
      { status: 'unhealthy', backend: 'error', detail },
      { status: 503 }
    );
  }
}
