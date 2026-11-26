import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { fetchDocumentFile } from '@/lib/api';

const forwardedHeaders = ['content-type', 'content-length', 'content-disposition', 'cache-control', 'x-content-type-options'];

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const token = cookies().get('access_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const download = request.nextUrl.searchParams.get('download') === '1';
  const upstream = await fetchDocumentFile(token, params.id, download);
  if (upstream.status === 401) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (!upstream.ok || !upstream.body) {
    return new NextResponse('Document not found', { status: upstream.status === 404 ? 404 : 502 });
  }

  const headers = new Headers();
  forwardedHeaders.forEach((name) => {
    const value = upstream.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  });
  return new NextResponse(upstream.body, { status: 200, headers });
}
