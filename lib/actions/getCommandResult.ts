import { bridgeStorageConfigured } from '../bridge/commandStore.js';
import { getCommandResult as readCommandResult } from '../bridge/resultStore.js';

export type GetCommandResultInput = {
  command_id?: string;
};

export async function getCommandResult(input: GetCommandResultInput = {}) {
  const commandId = String(input.command_id || '').trim();
  if (!commandId) throw new Error('COMMAND_ID_REQUIRED');
  if (!bridgeStorageConfigured()) throw new Error('BRIDGE_STORAGE_NOT_CONFIGURED');

  const result = await readCommandResult(commandId);
  if (!result) {
    return { status: 'pending', command_id: commandId, result: null };
  }

  return { status: 'completed', command_id: commandId, result };
}
