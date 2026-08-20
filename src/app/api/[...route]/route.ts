import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, props: { params: Promise<{ route: string[] }> }) {
  return handleProxy(req, props);
}

export async function POST(req: NextRequest, props: { params: Promise<{ route: string[] }> }) {
  return handleProxy(req, props);
}

export async function PUT(req: NextRequest, props: { params: Promise<{ route: string[] }> }) {
  return handleProxy(req, props);
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ route: string[] }> }) {
  return handleProxy(req, props);
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ route: string[] }> }) {
  return handleProxy(req, props);
}

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ route: string[] }> }) {
  try {
    const routeArray = (await params).route;
    const route = routeArray.join('/');
    
    const url = new URL(req.url);
    
    // Force ALL traffic to go through our own Centralized Proxy Server (Express Backend)
    const localBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
    const destinationUrl = `${localBase}/api/${route}${url.search}`;
    
    // Prepare headers
    const headers = new Headers();
    const contentType = req.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    } else {
      headers.set('Content-Type', 'application/json');
    }

    const contentLength = req.headers.get('content-length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }
    
    // Forward cookie for authentication
    const cookie = req.headers.get('cookie');
    if (cookie) {
      headers.set('cookie', cookie);
    }
    
    // Forward all custom headers starting with x- (e.g. x-backone-site-uuid, x-view-as-agent)
    req.headers.forEach((value, name) => {
      if (name.toLowerCase().startsWith('x-')) {
        headers.set(name, value);
      }
    });
    
    const hasBody = !['GET', 'HEAD'].includes(req.method);
    const body = hasBody ? req.body : undefined;
    
    const response = await fetch(destinationUrl, {
      method: req.method,
      headers,
      body: body,
      cache: 'no-store', // Prevent Next.js from aggressively caching the backend response
      // @ts-ignore
      duplex: hasBody ? 'half' : undefined,
    });
    
    const responseBuffer = await response.arrayBuffer();
    
    const nextResponse = new NextResponse(responseBuffer, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      }
    });
    
    const rawCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
    if (rawCookies.length > 0) {
      rawCookies.forEach(cookie => {
        nextResponse.headers.append('Set-Cookie', cookie);
      });
    } else {
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        nextResponse.headers.set('Set-Cookie', setCookieHeader);
      }
    }

    return nextResponse;
  } catch (error: any) {
    console.error('[Proxy Error]', error);
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
}
