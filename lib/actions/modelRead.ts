import { getConfiguredSketchupSessionId } from '../config/sketchupSession.js';
import { getModelSnapshot, type ModelEntity } from '../model/modelStore.js';

async function requireSnapshot() {
  const sessionId = getConfiguredSketchupSessionId();
  const snapshot = await getModelSnapshot(sessionId);
  if (!snapshot) throw new Error('MODEL_SNAPSHOT_NOT_AVAILABLE');
  return snapshot;
}

export async function getModelSummary() {
  const snapshot = await requireSnapshot();
  const groups = snapshot.entities.filter((entity) => entity.type === 'group').length;
  const components = snapshot.entities.filter((entity) => entity.type === 'component_instance').length;

  return {
    snapshot_version: snapshot.snapshot_version,
    captured_at: snapshot.captured_at,
    model: snapshot.model,
    counts: {
      entities: snapshot.entities.length,
      groups,
      component_instances: components,
      materials: snapshot.materials.length,
      tags: snapshot.tags.length,
      scenes: snapshot.scenes.length,
      selected: snapshot.selection.length
    },
    top_level_entities: snapshot.entities.filter((entity) => entity.parent_key === null).slice(0, 100),
    selection: snapshot.selection
  };
}

export type FindEntitiesInput = {
  query?: string;
  type?: 'group' | 'component_instance';
  limit?: number;
};

function haystack(entity: ModelEntity) {
  return [entity.name, entity.definition_name, entity.tag, entity.material]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export async function findEntities(input: FindEntitiesInput = {}) {
  const snapshot = await requireSnapshot();
  const query = String(input.query || '').trim().toLowerCase();
  const limit = Math.max(1, Math.min(Number(input.limit) || 50, 100));

  const matches = snapshot.entities.filter((entity) => {
    if (input.type && entity.type !== input.type) return false;
    if (!query) return true;
    return haystack(entity).includes(query);
  });

  return {
    snapshot_version: snapshot.snapshot_version,
    total_matches: matches.length,
    entities: matches.slice(0, limit)
  };
}

export type GetEntityInput = {
  entity_key?: string;
  persistent_id?: number | string;
};

function resolveEntity(entities: ModelEntity[], input: GetEntityInput) {
  const entityKey = String(input.entity_key || '').trim();
  if (entityKey) {
    const entity = entities.find((item) => item.entity_key === entityKey);
    if (!entity) throw new Error('ENTITY_NOT_FOUND');
    return entity;
  }

  const persistentId = Number(input.persistent_id);
  if (!Number.isFinite(persistentId)) throw new Error('ENTITY_REFERENCE_REQUIRED');
  const matches = entities.filter((item) => item.persistent_id === persistentId);
  if (matches.length === 0) throw new Error('ENTITY_NOT_FOUND');
  if (matches.length > 1) throw new Error('ENTITY_AMBIGUOUS_USE_ENTITY_KEY');
  return matches[0];
}

export async function getEntity(input: GetEntityInput = {}) {
  const snapshot = await requireSnapshot();
  const entity = resolveEntity(snapshot.entities, input);

  return {
    snapshot_version: snapshot.snapshot_version,
    entity,
    children_count: snapshot.entities.filter((item) => item.parent_key === entity.entity_key).length
  };
}

export async function getChildren(input: GetEntityInput = {}) {
  const snapshot = await requireSnapshot();
  const entity = resolveEntity(snapshot.entities, input);

  return {
    snapshot_version: snapshot.snapshot_version,
    parent: entity,
    entities: snapshot.entities.filter((item) => item.parent_key === entity.entity_key)
  };
}

export async function getSelection() {
  const snapshot = await requireSnapshot();
  const selected = new Set(snapshot.selection);
  return {
    snapshot_version: snapshot.snapshot_version,
    persistent_ids: snapshot.selection,
    entities: snapshot.entities.filter((item) => selected.has(item.persistent_id))
  };
}
