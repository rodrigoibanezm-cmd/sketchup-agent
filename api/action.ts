import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redisConfigured, setJson } from '../lib/redis.js';

const SUPPORTED_ACTIONS = new Set(['create_box', 'move_entity', 'set_material']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { session_id, action, args } = req.body || {};
  if (!session_id || !action) {
    return res.status(400).json({ error: 'session_id_and_action_required' });
  }

  if (!SUPPORTED_ACTIONS.has(String(action))) {
    return res.status(400).json({ error: 'unsupported_action', supported_actions: [...SUPPORTED_ACTIONS] });
  }

  if (!redisConfigured()) {
    return res.status(503).json({ error: 'bridge_storage_not_configured' });
  }

  const commandId = crypto.randomUUID();
  const command = {
    command_id: commandId,
    action: String(action),
    args: args && typeof args === 'object' ? args : {}
  };

  try {
    await setJson(`session:${session_id}:command`, command, 300);
    return res.status(202).json({
      ok: true,
      status: 'queued',
      session_id,
      command_id: commandId,
      command
    });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'unknown_error' });
  }
}
