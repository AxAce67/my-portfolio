import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export type LoginAuditOutcome = 'success' | 'invalid_credentials' | 'rate_limited';

type LoginAuditPayload = {
  email: string;
  ipAddress: string;
  userAgent: string;
  locale: string;
  outcome: LoginAuditOutcome;
  userId?: string | null;
};

function maskEmail(email: string) {
  const trimmed = email.trim().toLowerCase();
  const [local, domain] = trimmed.split('@');
  if (!local || !domain) return 'invalid_email';
  const first = local.charAt(0);
  return `${first}***@${domain}`;
}

function hashIpAddress(ipAddress: string) {
  const salt = process.env.AUTH_AUDIT_IP_SALT ?? 'portfolio-default-salt';
  return createHash('sha256').update(`${salt}:${ipAddress}`).digest('hex');
}

export async function recordLoginAudit(payload: LoginAuditPayload) {
  const row = {
    email_masked: maskEmail(payload.email),
    email_input: payload.email.trim().toLowerCase().slice(0, 320),
    ip_hash: hashIpAddress(payload.ipAddress),
    ip_address: payload.ipAddress.slice(0, 64),
    user_agent: payload.userAgent.slice(0, 500),
    locale: payload.locale,
    outcome: payload.outcome,
    user_id: payload.userId ?? null,
  };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('auth_audit_logs').insert(row);
    if (error) {
      console.warn('[auth_audit_logs] insert failed:', error.message);
    }
  } catch (error) {
    console.warn('[auth_audit_logs] insert exception:', error);
  }

  console.info('[auth_audit_logs]', row);
}
