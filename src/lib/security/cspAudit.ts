import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';

type CspAuditPayload = {
  documentUri: string | null;
  blockedUri: string | null;
  effectiveDirective: string | null;
  violatedDirective: string | null;
  disposition: string | null;
  sourceFile: string | null;
  lineNumber: number | null;
  columnNumber: number | null;
  statusCode: number | null;
  originalPolicy: string | null;
  referrer: string | null;
  userAgent: string;
  ipAddress: string;
};

function hashIpAddress(ipAddress: string) {
  const salt = process.env.AUTH_AUDIT_IP_SALT ?? 'portfolio-default-salt';
  return createHash('sha256').update(`${salt}:${ipAddress}`).digest('hex');
}

function truncate(value: string | null | undefined, max: number) {
  if (!value) return null;
  return value.slice(0, max);
}

export async function recordCspAudit(payload: CspAuditPayload) {
  const row = {
    document_uri: truncate(payload.documentUri, 2048),
    blocked_uri: truncate(payload.blockedUri, 2048),
    effective_directive: truncate(payload.effectiveDirective, 120),
    violated_directive: truncate(payload.violatedDirective, 120),
    disposition: truncate(payload.disposition, 40),
    source_file: truncate(payload.sourceFile, 2048),
    line_number: payload.lineNumber,
    column_number: payload.columnNumber,
    status_code: payload.statusCode,
    original_policy: truncate(payload.originalPolicy, 6000),
    referrer: truncate(payload.referrer, 2048),
    user_agent: truncate(payload.userAgent, 500),
    ip_hash: hashIpAddress(payload.ipAddress),
  };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('csp_violation_logs').insert(row);
    if (error) {
      console.warn('[csp_violation_logs] insert failed:', error.message);
    }
  } catch (error) {
    console.warn('[csp_violation_logs] insert exception:', error);
  }

  console.info('[csp_violation_logs]', row);
}
