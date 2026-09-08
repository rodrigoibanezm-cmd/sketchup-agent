import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDelJson, redisConfigured } from '../lib/redis.js';

type Command = {
  command_id: string;
  action: string;
  args: Record<string, unknown>;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const sessionId = String(req.query.session_id || '');
  if (!sessionId) {
    return res.status(400).json({ error: 'session_id_required' });
  }

  if (!redisConfigured()) {
    return res.status(503).json({ error: 'bridge_storage_not_configured' });
  }

  try {
    const command = await getDelJson<Command>(`session:${sessionId}:command`);
    return res.status(200).json({ ok: true, command });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'unknown_error' });
  }
}
