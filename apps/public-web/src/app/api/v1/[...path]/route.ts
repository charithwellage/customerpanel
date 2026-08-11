import { NextRequest, NextResponse } from 'next/server';

async function proxyRequest(request: NextRequest, paramsPromise: Promise<{ path: string[] }>) {
  const params = await paramsPromise;
  const path = (params.path || []).join('/');
  const apiBaseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:4000';
  const search = request.nextUrl.search || '';
  const targetUrl = `${apiBaseUrl}/api/v1/${path}${search}`;

  try {
    const headers = new Headers();
    const contentType = request.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);

    const body = ['POST', 'PUT', 'PATCH'].includes(request.method) ? await request.text() : undefined;

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });

    const responseData = await response.text();
    return new NextResponse(responseData, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to connect to API backend' }, { status: 502 });
  }
}

export async function GET(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, props.params);
}

export async function POST(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, props.params);
}

export async function PUT(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, props.params);
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, props.params);
}
