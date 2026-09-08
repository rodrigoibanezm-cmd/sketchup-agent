import { bridgeStorageConfigured, putPendingCommand } from '../bridge/commandStore.js';

const SUPPORTED_COMMANDS = new Set(['create_box', 'move_entity', 'set_material']);

export type SendCommandInput = {
  session_id?: string;
  command?: string;
  args?: Record<string, unknown>;
};

export async function sendCommand(input: SendCommandInput = {}) {
  const sessionId = String(input.session_id || '').trim();
  const commandName = String(input.command || '').trim();
  const args = input.args && typeof input.args === 'object' && !Array.isArray(input.args) ? input.args : {};

  if (!sessionId) throw new Error('SESSION_ID_REQUIRED');
  if (!commandName) throw new Error('COMMAND_REQUIRED');
  if (!SUPPORTED_COMMANDS.has(commandName)) throw new Error('UNSUPPORTED_COMMAND');
  if (!bridgeStorageConfigured()) throw new Error('BRIDGE_STORAGE_NOT_CONFIGURED');

  const command = {
    command_id: crypto.randomUUID(),
    action: commandName,
    args
  };

  await putPendingCommand(sessionId, command);

  return {
    status: 'pending',
    session_id: sessionId,
    command_id: command.command_id,
    command
  };
}

export function listSupportedCommands() {
  return [...SUPPORTED_COMMANDS];
}
