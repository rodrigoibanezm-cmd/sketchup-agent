import { getBridgeStatus } from './actions/getBridgeStatus.js';
import { getCommandResult } from './actions/getCommandResult.js';
import { sendCommand } from './actions/sendCommand.js';

const ACTIONS = Object.freeze({
  SEND_COMMAND: sendCommand,
  GET_COMMAND_RESULT: getCommandResult,
  GET_BRIDGE_STATUS: getBridgeStatus
});

export type CustomGptAction = keyof typeof ACTIONS;

export function listCustomGptActions() {
  return Object.keys(ACTIONS);
}

export async function runCustomGptAction(action: string, input: Record<string, unknown> = {}) {
  const handler = ACTIONS[action as CustomGptAction];
  if (!handler) throw new Error('UNKNOWN_CUSTOM_GPT_ACTION');
  return handler(input as never);
}
