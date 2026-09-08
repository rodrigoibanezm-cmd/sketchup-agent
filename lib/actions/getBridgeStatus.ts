import { bridgeStorageConfigured } from '../bridge/commandStore.js';
import { getConfiguredSketchupSessionId, sketchupSessionConfigured } from '../config/sketchupSession.js';
import { getModelSnapshot } from '../model/modelStore.js';
import { listSupportedCommands } from './sendCommand.js';

export async function getBridgeStatus() {
  let modelState: Record<string, unknown> = { available: false };

  if (bridgeStorageConfigured() && sketchupSessionConfigured()) {
    const snapshot = await getModelSnapshot(getConfiguredSketchupSessionId());
    if (snapshot) {
      const ageSeconds = Math.max(0, Math.round((Date.now() - Date.parse(snapshot.captured_at)) / 1000));
      modelState = {
        available: true,
        snapshot_version: snapshot.snapshot_version,
        captured_at: snapshot.captured_at,
        age_seconds: ageSeconds,
        plugin_online: ageSeconds <= 30
      };
    }
  }

  return {
    bridge_storage: bridgeStorageConfigured() ? 'configured' : 'not_configured',
    sketchup_session: sketchupSessionConfigured() ? 'configured' : 'not_configured',
    supported_commands: listSupportedCommands(),
    model_state: modelState
  };
}
