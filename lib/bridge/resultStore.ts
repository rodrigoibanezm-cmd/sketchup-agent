import { getJson, setJson } from '../redis.js';

export type BridgeResult = {
  session_id: string;
  command_id: string;
  result: unknown;
};

export async function putCommandResult(value: BridgeResult) {
  return setJson(`result:${value.command_id}`, value, 600);
}

export async function getCommandResult(commandId: string) {
  return getJson<BridgeResult>(`result:${commandId}`);
}
