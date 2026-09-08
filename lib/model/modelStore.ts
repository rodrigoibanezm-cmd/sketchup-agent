import { getJson, setJson } from '../redis.js';

export type ModelEntity = {
  entity_key: string;
  parent_key: string | null;
  persistent_id: number;
  type: 'group' | 'component_instance';
  name: string;
  definition_name?: string;
  tag?: string;
  material?: string | null;
  coordinate_space: 'parent';
  bbox_mm?: [number, number, number, number, number, number];
  transform?: number[];
};

export type ModelSnapshot = {
  session_id: string;
  snapshot_version: number;
  captured_at: string;
  model: {
    title?: string;
    path?: string;
    guid?: string;
    modified?: boolean;
    units?: string;
  };
  selection: number[];
  entities: ModelEntity[];
  materials: string[];
  tags: string[];
  scenes: Array<{ name: string }>;
};

const TTL_SECONDS = 60 * 60 * 24;

export async function putModelSnapshot(snapshot: ModelSnapshot) {
  return setJson(`model:${snapshot.session_id}:snapshot`, snapshot, TTL_SECONDS);
}

export async function getModelSnapshot(sessionId: string) {
  return getJson<ModelSnapshot>(`model:${sessionId}:snapshot`);
}
