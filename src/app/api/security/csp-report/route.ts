import { NextResponse } from 'next/server';
import { recordCspAudit } from '@/lib/security/cspAudit';

const MAX_CSP_REPORT_BYTES = 64 * 1024;
const ALLOWED_CONTENT_TYPES = [
  'application/csp-report',
  'application/reports+json',
  'application/json',
];

type CspLegacyReport = {
  'csp-report'?: Record<string, unknown>;
};

type CspReportingApiEnvelope = {
  type?: string;
  body?: Record<string, unknown>;
};

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function extractBodies(input: unknown): Record<string, unknown>[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => {
        const envelope = item as CspReportingApiEnvelope;
        if (envelope && typeof envelope === 'object' && envelope.body && typeof envelope.body === 'object') {
          return envelope.body;
        }
        return null;
      })
      .filter((body): body is Record<string, unknown> => Boolean(body));
  }

  if (input && typeof input === 'object') {
    const legacy = input as CspLegacyReport;
    if (legacy['csp-report'] && typeof legacy['csp-report'] === 'object') {
      return [legacy['csp-report']];
    }
  }

  return [];
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_CSP_REPORT_BYTES) {
    return new NextResponse(null, { status: 204 });
  }

  const contentType = (request.headers.get('content-type') ?? '').toLowerCase();
  if (contentType && !ALLOWED_CONTENT_TYPES.some((allowed) => contentType.includes(allowed))) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    const payload = await request.json();
    const bodies = extractBodies(payload).slice(0, 10);
    const userAgent = request.headers.get('user-agent') ?? 'unknown';
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

    await Promise.all(
      bodies.map((body) =>
        recordCspAudit({
          documentUri: toStringOrNull(body['document-uri']),
          blockedUri: toStringOrNull(body['blocked-uri']),
          effectiveDirective: toStringOrNull(body['effective-directive']),
          violatedDirective: toStringOrNull(body['violated-directive']),
          disposition: toStringOrNull(body.disposition),
          sourceFile: toStringOrNull(body['source-file']),
          lineNumber: toNumber(body['line-number']),
          columnNumber: toNumber(body['column-number']),
          statusCode: toNumber(body['status-code']),
          originalPolicy: toStringOrNull(body['original-policy']),
          referrer: toStringOrNull(body.referrer),
          userAgent,
          ipAddress,
        })
      )
    );
  } catch {
    // no-op: CSP report endpoint should never fail the browser request
  }

  return new NextResponse(null, { status: 204 });
}
