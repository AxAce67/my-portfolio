import { NextResponse, type NextRequest } from 'next/server';
import { isAppLocale } from '@/i18n/locales';
import { CONTACT_MESSAGES_TABLE_ID, DATABASE_ID } from '@/lib/appwrite/client';

// Contact form backend: the Turnstile token is verified here with the secret
// key (the widget alone does not stop scripts that post directly). The message
// is saved to the Appwrite inbox (read in /admin/inbox) and announced on ntfy.
// Either one succeeding counts as delivered: if saving fails, the ntfy message
// carries the full text so nothing is lost.

const LIMITS = { name: 100, email: 254, subject: 200, message: 5000 } as const;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

const recentSubmissions = new Map<string, number[]>();

function clientIp(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (recentSubmissions.get(ip) ?? []).filter((at) => now - at < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    recentSubmissions.set(ip, recent);
    return true;
  }
  recent.push(now);
  recentSubmissions.set(ip, recent);
  return false;
}

function field(body: Record<string, unknown>, key: keyof typeof LIMITS): string | null {
  const value = typeof body[key] === 'string' ? (body[key] as string).trim() : '';
  return value.length <= LIMITS[key] ? value : null;
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token, ...(ip !== 'unknown' ? { remoteip: ip } : {}) }),
    cache: 'no-store',
  });
  if (!response.ok) return false;
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}

type ContactMessage = { name: string; email: string; subject: string; message: string; locale: string };

/** Insert the row with a server API key that can only write rows. Returns the row ID. */
async function saveMessage(input: ContactMessage): Promise<string | null> {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_CONTACT_API_KEY;
  if (!endpoint || !project || !key) return null;

  const response = await fetch(`${endpoint}/tablesdb/${DATABASE_ID}/tables/${CONTACT_MESSAGES_TABLE_ID}/rows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Appwrite-Project': project, 'X-Appwrite-Key': key },
    body: JSON.stringify({ rowId: 'unique()', data: { ...input, status: 'new' } }),
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const row = (await response.json()) as { $id?: string };
  return row.$id ?? null;
}

async function notifyNtfy(input: ContactMessage, saved: boolean): Promise<boolean> {
  const url = process.env.NTFY_URL;
  const token = process.env.NTFY_CONTACT_TOKEN;
  if (!url || !token) return false;

  const from = input.email ? `${input.name} <${input.email}>` : input.name;
  // When the row is saved the inbox holds the full text, so a preview is enough.
  const body = saved
    ? `${from}\n\n${input.message.length > 400 ? `${input.message.slice(0, 400)}…` : input.message}`
    : `⚠️ 受信箱への保存に失敗したので、全文をここに残します。\n${from}\n\n${input.message}`;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aki.quest';

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      topic: 'contact',
      title: `✉️ aki.quest：${input.subject}`.slice(0, 250),
      message: body,
      priority: 4,
      click: `${site}/ja/admin/inbox`,
    }),
    cache: 'no-store',
  });
  return response.ok;
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }

  const name = field(body, 'name');
  const email = field(body, 'email');
  const subject = field(body, 'subject');
  const message = field(body, 'message');
  const token = typeof body.token === 'string' ? body.token : '';
  const locale = typeof body.locale === 'string' && isAppLocale(body.locale) ? body.locale : '';

  if (!name || email === null || !subject || !message || !token) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }

  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  try {
    if (!(await verifyTurnstile(token, ip))) {
      return NextResponse.json({ ok: false, error: 'turnstile' }, { status: 403 });
    }
    const input = { name, email, subject, message, locale };
    const savedId = await saveMessage(input).catch(() => null);
    const notified = await notifyNtfy(input, savedId !== null).catch(() => false);
    if (!savedId && !notified) {
      return NextResponse.json({ ok: false, error: 'delivery' }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'delivery' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
