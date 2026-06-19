const requestCounts = new Map<string, { count: number; resetAt: number }>();
let lastCleanup = Date.now();

function cleanupStale() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of requestCounts) {
    if (now > entry.resetAt) requestCounts.delete(key);
  }
}

export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  cleanupStale();
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

export function rateLimitByIp(
  request: Request,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "127.0.0.1";
  return rateLimit(`ip:${ip}`, maxRequests, windowMs);
}
