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
    
    let destinationUrl = '';
    const url = new URL(req.url);

    if (routeArray[0] === 'auth' || routeArray[0] === 'dashboard') {
      const localBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
      destinationUrl = `${localBase}/api/${route}${url.search}`;
    } else {
      const baseUrl = process.env.BACKONE_BASE_URL || process.env.NETIFY_BASE_URL || 'https://manager.netify.ai/api/v1';
      destinationUrl = `${baseUrl}/${route}${url.search}`;
    }
    
    // Prepare headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    if (routeArray[0] !== 'auth' && routeArray[0] !== 'dashboard') {
      const apiKey = process.env.BACKONE_API_KEY || process.env.NETIFY_API_KEY;
      const jwtToken = process.env.BACKONE_JWT_TOKEN || process.env.NETIFY_JWT_TOKEN;
      const siteUuid = process.env.BACKONE_SITE_UUID || process.env.NETIFY_SITE_UUID;

      const apiToken = apiKey || jwtToken;
      if (apiToken) {
        headers.set('x-api-key', apiToken);
      }
      if (siteUuid) {
        headers.set('x-net-site', siteUuid);
      }
    } else {
      // For local auth/dashboard routes, pass along the cookie for authentication
      const cookie = req.headers.get('cookie');
      if (cookie) {
        headers.set('cookie', cookie);
      }
      // Forward X-View-As-Agent header for view-as mode data filtering
      const viewAsHeader = req.headers.get('x-view-as-agent');
      if (viewAsHeader) {
        headers.set('x-view-as-agent', viewAsHeader);
      }
    }
    
    // Some requests like GET cannot have a body
    const hasBody = !['GET', 'HEAD'].includes(req.method);
    let body = null;
    
    if (hasBody) {
      body = await req.text();
    }
    
    const response = await fetch(destinationUrl, {
      method: req.method,
      headers,
      body: body || undefined,
    });
    
    // Return raw text so we don't try to parse it if it's not JSON
    const responseText = await response.text();
    
    // Build the response
    const nextResponse = new NextResponse(responseText, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      }
    });
    
    // Forward ALL Set-Cookie headers individually so cookies reach the browser
    // This is critical for view_as_token and auth token cookies
    const rawCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
    if (rawCookies.length > 0) {
      rawCookies.forEach(cookie => {
        nextResponse.headers.append('Set-Cookie', cookie);
      });
    } else {
      // Fallback: single set-cookie header
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
