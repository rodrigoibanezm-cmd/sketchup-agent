import { getBridgeStatus } from './actions/getBridgeStatus.js';
import { getCommandResult } from './actions/getCommandResult.js';
import {
  findEntities,
  getChildren,
  getEntity,
  getModelSummary,
  getSelection
} from './actions/modelRead.js';
import { sendCommand } from './actions/sendCommand.js';

type ActionHandler = (input: Record<string, unknown>) => Promise<unknown>;

const ACTIONS: Record<string, ActionHandler> = Object.freeze({
  SEND_COMMAND: (input) => sendCommand(input),
  GET_COMMAND_RESULT: (input) => getCommandResult(input),
  GET_BRIDGE_STATUS: () => getBridgeStatus(),
  GET_MODEL_SUMMARY: () => getModelSummary(),
  FIND_ENTITIES: (input) => findEntities(input),
  GET_ENTITY: (input) => getEntity(input),
  GET_CHILDREN: (input) => getChildren(input),
  GET_SELECTION: () => getSelection()
});

export function listCustomGptActions() {
  return Object.keys(ACTIONS);
}

export async function runCustomGptAction(action: string, input: Record<string, unknown> = {}) {
  const handler = ACTIONS[action];
  if (!handler) throw new Error('UNKNOWN_CUSTOM_GPT_ACTION');
  return handler(input);
}
