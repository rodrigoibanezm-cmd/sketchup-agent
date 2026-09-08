const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export function redisConfigured() {
  return Boolean(redisUrl && redisToken);
}

async function command(args: Array<string | number>) {
  if (!redisUrl || !redisToken) {
    throw new Error('redis_not_configured');
  }

  const response = await fetch(redisUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${redisToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args)
  });

  if (!response.ok) {
    throw new Error(`redis_http_${response.status}`);
  }

  const payload = await response.json() as { result?: unknown; error?: string };
  if (payload.error) throw new Error(payload.error);
  return payload.result;
}

export async function setJson(key: string, value: unknown, ttlSeconds = 300) {
  return command(['SET', key, JSON.stringify(value), 'EX', ttlSeconds]);
}

export async function getJson<T>(key: string): Promise<T | null> {
  const raw = await command(['GET', key]);
  if (raw === null || raw === undefined) return null;
  return JSON.parse(String(raw)) as T;
}

export async function getDelJson<T>(key: string): Promise<T | null> {
  const raw = await command(['GETDEL', key]);
  if (raw === null || raw === undefined) return null;
  return JSON.parse(String(raw)) as T;
}
