import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getJson, redisConfigured, setJson } from '../lib/redis.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!redisConfigured()) {
    return res.status(503).json({ error: 'bridge_storage_not_configured' });
  }

  if (req.method === 'POST') {
    const { session_id, command_id, result } = req.body || {};
    if (!session_id || !command_id) {
      return res.status(400).json({ error: 'session_id_and_command_id_required' });
    }

    try {
      await setJson(`result:${command_id}`, { session_id, command_id, result }, 600);
      return res.status(200).json({ ok: true });
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : 'unknown_error' });
    }
  }

  if (req.method === 'GET') {
    const commandId = String(req.query.command_id || '');
    if (!commandId) {
      return res.status(400).json({ error: 'command_id_required' });
    }

    try {
      const result = await getJson(`result:${commandId}`);
      return res.status(200).json({ ok: true, result });
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : 'unknown_error' });
    }
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}
