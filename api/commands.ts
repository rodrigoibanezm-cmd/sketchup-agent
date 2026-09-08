import type { VercelRequest, VercelResponse } from '@vercel/node';
import { bridgeStorageConfigured, takePendingCommand } from '../lib/bridge/commandStore.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const sessionId = String(req.query.session_id || '').trim();
  if (!sessionId) {
    return res.status(400).json({ error: 'session_id_required' });
  }

  if (!bridgeStorageConfigured()) {
    return res.status(503).json({ error: 'bridge_storage_not_configured' });
  }

  try {
    const command = await takePendingCommand(sessionId);
    return res.status(200).json({ ok: true, command });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'unknown_error' });
  }
}
