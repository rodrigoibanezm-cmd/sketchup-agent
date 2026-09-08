import { bridgeStorageConfigured } from '../bridge/commandStore.js';
import { sketchupSessionConfigured } from '../config/sketchupSession.js';
import { listSupportedCommands } from './sendCommand.js';

export async function getBridgeStatus() {
  return {
    bridge_storage: bridgeStorageConfigured() ? 'configured' : 'not_configured',
    sketchup_session: sketchupSessionConfigured() ? 'configured' : 'not_configured',
    supported_commands: listSupportedCommands()
  };
}
