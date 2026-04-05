import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ online: false });
  }
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    return NextResponse.json({ online: res.ok });
  } catch {
    return NextResponse.json({ online: false });
  }
}
