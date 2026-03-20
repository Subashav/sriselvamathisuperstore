type RateWindow = {
  count: number;
  expiresAt: number;
};

const memoryStore = new Map<string, RateWindow>();

export const checkRateLimit = (key: string, max = 20, windowMs = 60_000) => {
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || existing.expiresAt <= now) {
    memoryStore.set(key, { count: 1, expiresAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }

  if (existing.count >= max) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  memoryStore.set(key, existing);
  return { allowed: true, remaining: max - existing.count };
};
