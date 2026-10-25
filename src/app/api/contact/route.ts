import { NextResponse, type NextRequest } from 'next/server';

// Contact form backend: the Turnstile token is verified here with the secret
// key (the widget alone does not stop scripts that post directly), and the
// message is delivered to a Discord webhook.

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

async function sendToDiscord(name: string, email: string, subject: string, message: string): Promise<boolean> {
  const webhookUrl = process.env.CONTACT_DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return false;

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'aki.quest contact',
      // Never let form input ping @everyone or roles.
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: subject.slice(0, 256),
          description: message.slice(0, 4096),
          fields: [
            { name: 'Name', value: name.slice(0, 1024), inline: true },
            { name: 'Email', value: (email || '-').slice(0, 1024), inline: true },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
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
    if (!(await sendToDiscord(name, email, subject, message))) {
      return NextResponse.json({ ok: false, error: 'delivery' }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'delivery' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
