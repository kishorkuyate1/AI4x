import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      { error: 'N8N_WEBHOOK_URL is not configured.' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();

    const upstream = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
      headers: {
        accept: 'application/json',
      },
    });

    const contentType = upstream.headers.get('content-type') || '';
    const responseBody = contentType.includes('application/json')
      ? await upstream.json()
      : await upstream.text();

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: typeof responseBody === 'string' ? responseBody : 'n8n request failed',
          status: upstream.status,
          details: responseBody,
        },
        { status: upstream.status }
      );
    }

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown proxy error',
      },
      { status: 500 }
    );
  }
}
