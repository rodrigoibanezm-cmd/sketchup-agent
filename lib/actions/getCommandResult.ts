import { bridgeStorageConfigured } from '../bridge/commandStore.js';
import { getCommandResult as readCommandResult } from '../bridge/resultStore.js';
import { getConfiguredSketchupSessionId } from '../config/sketchupSession.js';

export type GetCommandResultInput = {
  command_id?: string;
};

export async function getCommandResult(input: GetCommandResultInput = {}) {
  const commandId = String(input.command_id || '').trim();
  if (!commandId) throw new Error('COMMAND_ID_REQUIRED');
  if (!bridgeStorageConfigured()) throw new Error('BRIDGE_STORAGE_NOT_CONFIGURED');

  const configuredSessionId = getConfiguredSketchupSessionId();
  const stored = await readCommandResult(commandId);

  if (!stored) {
    return { status: 'pending', command_id: commandId, result: null };
  }

  if (stored.session_id !== configuredSessionId) {
    throw new Error('COMMAND_RESULT_SESSION_MISMATCH');
  }

  return { status: 'completed', command_id: commandId, result: stored.result };
}
