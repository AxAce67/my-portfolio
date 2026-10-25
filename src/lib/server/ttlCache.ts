// Small in-process cache for public API routes that fan out to slow
// third-party APIs. Concurrent callers share one in-flight request, and
// failed results are kept only briefly so an outage recovers quickly.

type Entry<T> = { value: T; expiresAt: number };

export function cacheWithTtl<T>(
  load: () => Promise<T>,
  { ttlMs, failureTtlMs, isFailure }: { ttlMs: number; failureTtlMs: number; isFailure?: (value: T) => boolean },
): () => Promise<T> {
  let entry: Entry<T> | null = null;
  let inflight: Promise<T> | null = null;

  return async () => {
    if (entry && entry.expiresAt > Date.now()) return entry.value;
    if (inflight) return inflight;

    inflight = load()
      .then((value) => {
        const ttl = isFailure?.(value) ? failureTtlMs : ttlMs;
        entry = { value, expiresAt: Date.now() + ttl };
        return value;
      })
      .finally(() => {
        inflight = null;
      });

    return inflight;
  };
}
