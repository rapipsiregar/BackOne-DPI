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
    const route = (await params).route.join('/');
    const baseUrl = process.env.NETIFY_BASE_URL || 'https://manager.netify.ai/api/v1';
    
    // Construct the destination URL including search parameters
    const url = new URL(req.url);
    const destinationUrl = `${baseUrl}/${route}${url.search}`;
    
    // Prepare headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    if (process.env.NETIFY_JWT_TOKEN && process.env.NETIFY_SITE_UUID) {
      headers.set('x-api-key', process.env.NETIFY_JWT_TOKEN);
      headers.set('x-net-site', process.env.NETIFY_SITE_UUID);
    } else if (process.env.NETIFY_API_KEY) {
      headers.set('x-api-key', process.env.NETIFY_API_KEY);
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
    
    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      }
    });
  } catch (error: any) {
    console.error('[Proxy Error]', error);
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
}
