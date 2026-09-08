import type { VercelRequest, VercelResponse } from '@vercel/node';
import { bridgeStorageConfigured } from '../lib/bridge/commandStore.js';
import { getConfiguredSketchupSessionId } from '../lib/config/sketchupSession.js';
import { putModelSnapshot, type ModelSnapshot } from '../lib/model/modelStore.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  if (!bridgeStorageConfigured()) {
    return res.status(503).json({ error: 'bridge_storage_not_configured' });
  }

  const expectedSession = getConfiguredSketchupSessionId();
  const snapshot = req.body as ModelSnapshot;
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.session_id) {
    return res.status(400).json({ error: 'model_snapshot_required' });
  }
  if (String(snapshot.session_id) !== expectedSession) {
    return res.status(403).json({ error: 'session_mismatch' });
  }
  if (!Array.isArray(snapshot.entities) || !Array.isArray(snapshot.selection)) {
    return res.status(400).json({ error: 'invalid_model_snapshot' });
  }

  try {
    await putModelSnapshot(snapshot);
    return res.status(200).json({ ok: true, snapshot_version: snapshot.snapshot_version });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'unknown_error' });
  }
}
