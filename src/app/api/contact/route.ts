import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'edge';

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xeelrvkr';
const TURNSTILE_VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TURNSTILE_TIMEOUT_MS = 4500;
const FORMSPREE_TIMEOUT_MS = 8000;

type ContactPayload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  token?: string;
  honeypot?: string;
  elapsedMs?: number;
};

type TurnstileVerifyResponse = {
  success: boolean;
  'error-codes'?: string[];
};

const contactPayloadSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(320),
  subject: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(5000),
  token: z.string().trim().min(1).max(4096),
  honeypot: z.string().trim().max(200).optional().default(''),
  elapsedMs: z.number().finite().min(0).max(86_400_000).optional().default(0),
});

function badRequest(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
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

  const parsed = contactPayloadSchema.safeParse({
    name: payload.name ?? '',
    email: payload.email ?? '',
    subject: payload.subject ?? '',
    message: payload.message ?? '',
    token: payload.token ?? '',
    honeypot: payload.honeypot ?? '',
    elapsedMs: Number(payload.elapsedMs ?? 0),
  });

  if (!parsed.success) {
    return badRequest('Invalid contact payload.');
  }

  const { name, email, subject, message, token, honeypot, elapsedMs } = parsed.data;

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

  let verifyResponse: Response;
  try {
    verifyResponse = await fetchWithTimeout(
      TURNSTILE_VERIFY_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: verifyBody.toString(),
        cache: 'no-store',
      },
      TURNSTILE_TIMEOUT_MS,
    );
  } catch {
    return NextResponse.json({ ok: false, message: 'Turnstile verification timed out.' }, { status: 504 });
  }

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
    subject,
    inquiry_subject: subject,
    message,
    _subject: `[akiz.dev] ${subject}`,
  });

  let forwardResponse: Response;
  try {
    forwardResponse = await fetchWithTimeout(
      FORMSPREE_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: forwardBody.toString(),
        cache: 'no-store',
      },
      FORMSPREE_TIMEOUT_MS,
    );
  } catch {
    return NextResponse.json({ ok: false, message: 'Sending request timed out.' }, { status: 504 });
  }

  if (!forwardResponse.ok) {
    return NextResponse.json({ ok: false, message: 'Failed to send message.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
