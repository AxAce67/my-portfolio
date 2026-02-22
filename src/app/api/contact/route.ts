import { NextResponse } from 'next/server';

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xeelrvkr';
const TURNSTILE_VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

type ContactPayload = {
  name?: string;
  email?: string;
  message?: string;
  token?: string;
  honeypot?: string;
  elapsedMs?: number;
};

type TurnstileVerifyResponse = {
  success: boolean;
  'error-codes'?: string[];
};

function badRequest(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

export async function POST(request: Request) {
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (!turnstileSecret) {
    return NextResponse.json({ ok: false, message: 'Turnstile secret is not configured.' }, { status: 500 });
  }

  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return badRequest('Invalid request body.');
  }

  const name = String(payload.name ?? '').trim();
  const email = String(payload.email ?? '').trim();
  const message = String(payload.message ?? '').trim();
  const token = String(payload.token ?? '').trim();
  const honeypot = String(payload.honeypot ?? '').trim();
  const elapsedMs = Number(payload.elapsedMs ?? 0);

  if (!name || !email || !message) {
    return badRequest('Missing required fields.');
  }
  if (!token) {
    return badRequest('Turnstile token is required.');
  }

  // Soft-drop obvious bot traffic without revealing detection details.
  if (honeypot || (Number.isFinite(elapsedMs) && elapsedMs > 0 && elapsedMs < 2500)) {
    return NextResponse.json({ ok: true });
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  const verifyBody = new URLSearchParams({
    secret: turnstileSecret,
    response: token,
    ...(ipAddress ? { remoteip: ipAddress } : {}),
  });

  const verifyResponse = await fetch(TURNSTILE_VERIFY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: verifyBody.toString(),
    cache: 'no-store',
  });

  if (!verifyResponse.ok) {
    return NextResponse.json({ ok: false, message: 'Failed to verify Turnstile.' }, { status: 502 });
  }

  const verifyResult = (await verifyResponse.json()) as TurnstileVerifyResponse;
  if (!verifyResult.success) {
    return badRequest('Turnstile verification failed.');
  }

  const forwardBody = new URLSearchParams({
    name,
    email,
    message,
    _subject: 'New portfolio contact message',
  });

  const forwardResponse = await fetch(FORMSPREE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: forwardBody.toString(),
    cache: 'no-store',
  });

  if (!forwardResponse.ok) {
    return NextResponse.json({ ok: false, message: 'Failed to send message.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

