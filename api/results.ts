import type { VercelRequest, VercelResponse } from '@vercel/node';
import { bridgeStorageConfigured } from '../lib/bridge/commandStore.js';
import { putCommandResult } from '../lib/bridge/resultStore.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  if (!bridgeStorageConfigured()) {
    return res.status(503).json({ error: 'bridge_storage_not_configured' });
  }

  const { session_id, command_id, result } = req.body || {};
  if (!session_id || !command_id) {
    return res.status(400).json({ error: 'session_id_and_command_id_required' });
  }

  try {
    await putCommandResult({
      session_id: String(session_id),
      command_id: String(command_id),
      result
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'unknown_error' });
  }
}
