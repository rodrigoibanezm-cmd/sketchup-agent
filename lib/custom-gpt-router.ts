import { getBridgeStatus } from './actions/getBridgeStatus.js';
import { getCommandResult, type GetCommandResultInput } from './actions/getCommandResult.js';
import {
  findEntities,
  getChildren,
  getEntity,
  getModelSummary,
  getSelection,
  type FindEntitiesInput,
  type GetEntityInput
} from './actions/modelRead.js';
import { sendCommand, type SendCommandInput } from './actions/sendCommand.js';

type ActionHandler = (input: Record<string, unknown>) => Promise<unknown>;

const ACTIONS: Record<string, ActionHandler> = Object.freeze({
  SEND_COMMAND: (input) => sendCommand(input as SendCommandInput),
  GET_COMMAND_RESULT: (input) => getCommandResult(input as GetCommandResultInput),
  GET_BRIDGE_STATUS: () => getBridgeStatus(),
  GET_MODEL_SUMMARY: () => getModelSummary(),
  FIND_ENTITIES: (input) => findEntities(input as FindEntitiesInput),
  GET_ENTITY: (input) => getEntity(input as GetEntityInput),
  GET_CHILDREN: (input) => getChildren(input as GetEntityInput),
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
