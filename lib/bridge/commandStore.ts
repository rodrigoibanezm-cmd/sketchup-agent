import { getDelJson, redisConfigured, setJson } from '../redis.js';

export type BridgeCommand = {
  command_id: string;
  action: string;
  args: Record<string, unknown>;
};

export function bridgeStorageConfigured() {
  return redisConfigured();
}

export async function putPendingCommand(sessionId: string, command: BridgeCommand) {
  return setJson(`session:${sessionId}:command`, command, 300);
}

export async function takePendingCommand(sessionId: string) {
  return getDelJson<BridgeCommand>(`session:${sessionId}:command`);
}
