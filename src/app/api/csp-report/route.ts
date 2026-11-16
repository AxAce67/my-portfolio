import { type NextRequest } from 'next/server';

// Browsers post Content-Security-Policy-Report-Only violations here (report-uri).
// One short line per report goes to the server log, so violations seen while
// using the site (the admin pages included) can be read back later:
//   docker logs <portfolio container> 2>&1 | grep csp-report
// Nothing is stored; the page URL and blocked URL are cut at their path.
const MAX_BYTES = 8_192;

function short(value: unknown): string {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`.slice(0, 200);
  } catch {
    return value.slice(0, 100);
  }
}

export async function POST(request: NextRequest) {
  const text = (await request.text()).slice(0, MAX_BYTES);
  try {
    const body = JSON.parse(text) as { 'csp-report'?: Record<string, unknown> };
    const r = body['csp-report'] ?? {};
    console.warn(
      'csp-report',
      JSON.stringify({
        page: short(r['document-uri']),
        directive: String(r['violated-directive'] ?? r['effective-directive'] ?? '').slice(0, 60),
        blocked: short(r['blocked-uri']),
      }),
    );
  } catch {
    // not a CSP report
  }
  return new Response(null, { status: 204 });
}
