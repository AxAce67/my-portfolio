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

const MAX_EMAIL_LENGTH = 320;

function maskEmail(email: string) {
  const trimmed = email.trim().toLowerCase();
  const separatorIndex = trimmed.lastIndexOf('@');

  if (separatorIndex <= 0 || separatorIndex === trimmed.length - 1) {
    return 'invalid_email';
  }

  const local = trimmed.slice(0, separatorIndex);
  const domain = trimmed.slice(separatorIndex + 1);
  if (!local || !domain) return 'invalid_email';
  const [first = ''] = Array.from(local);

  if (!first) return 'invalid_email';

  return `${first}***@${domain}`.slice(0, MAX_EMAIL_LENGTH);
}

function hashIpAddress(ipAddress: string) {
  const salt = process.env.AUTH_AUDIT_IP_SALT ?? 'portfolio-default-salt';
  return createHash('sha256').update(`${salt}:${ipAddress}`).digest('hex');
}

export async function recordLoginAudit(payload: LoginAuditPayload) {
  const row = {
    email_masked: maskEmail(payload.email),
    email_input: payload.email.trim().toLowerCase().slice(0, MAX_EMAIL_LENGTH),
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
