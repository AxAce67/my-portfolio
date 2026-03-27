import { NextResponse } from 'next/server';

export const revalidate = 0;

export async function GET() {
    try {
        const res = await fetch('https://ntp-a1.nict.go.jp/cgi-bin/json', {
            next: { revalidate: 0 },
        });
        if (!res.ok) throw new Error('upstream error');
        const data = await res.json();
        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'no-store' },
        });
    } catch {
        return NextResponse.json({ error: 'unavailable' }, { status: 503 });
    }
}
