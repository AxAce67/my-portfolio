const memoryBuckets = new Map<string, { count: number; windowStart: number }>();

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

function canUseUpstash() {
  return Boolean(UPSTASH_URL && UPSTASH_TOKEN);
}

async function upstashRequest(path: string, method: 'GET' | 'POST' = 'GET', body?: unknown) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    throw new Error('Upstash is not configured');
  }

  const response = await fetch(`${UPSTASH_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Upstash request failed: ${response.status}`);
  }

  return response.json();
}

function getMemoryBucket(key: string, windowSeconds: number, now: number) {
  const windowMs = windowSeconds * 1000;
  const entry = memoryBuckets.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    const next = { count: 0, windowStart: now };
    memoryBuckets.set(key, next);
    return next;
  }
  return entry;
}

export async function getFailureCount(key: string, windowSeconds: number) {
  if (canUseUpstash()) {
    try {
      const encodedKey = encodeURIComponent(key);
      const result = await upstashRequest(`/get/${encodedKey}`);
      const count = Number(result?.result ?? 0);
      return Number.isFinite(count) ? count : 0;
    } catch {
      // fall through to memory fallback
    }
  }

  const now = Date.now();
  const bucket = getMemoryBucket(key, windowSeconds, now);
  return bucket.count;
}

export async function recordFailure(key: string, windowSeconds: number) {
  if (canUseUpstash()) {
    try {
      const result = await upstashRequest('/pipeline', 'POST', [
        ['INCR', key],
        ['EXPIRE', key, windowSeconds],
      ]);
      const count = Number(result?.[0]?.result ?? 0);
      if (Number.isFinite(count)) return count;
    } catch {
      // fall through to memory fallback
    }
  }

  const now = Date.now();
  const bucket = getMemoryBucket(key, windowSeconds, now);
  bucket.count += 1;
  memoryBuckets.set(key, bucket);
  return bucket.count;
}

export async function clearFailures(key: string) {
  if (canUseUpstash()) {
    try {
      const encodedKey = encodeURIComponent(key);
      await upstashRequest(`/del/${encodedKey}`);
      return;
    } catch {
      // fall through to memory fallback
    }
  }

  memoryBuckets.delete(key);
}
