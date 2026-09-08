# Catálogo — SketchUp Agent

## Superficie pública del Custom GPT
El Custom GPT usa exclusivamente:

```text
POST /api/custom-gpt
```

Acciones públicas:
- `SEND_COMMAND`
- `GET_COMMAND_RESULT`
- `GET_BRIDGE_STATUS`
- `GET_MODEL_SUMMARY`
- `FIND_ENTITIES`
- `GET_ENTITY`
- `GET_CHILDREN`
- `GET_SELECTION`

Los endpoints usados por el plugin (`/api/commands`, `/api/results`, `/api/model-state`) son internos y no forman parte de la superficie del Custom GPT.

## Sesión objetivo
La instalación de SketchUp objetivo se configura en el backend mediante `SKETCHUP_SESSION_ID`. El agente no pide ni envía `session_id`.

## MODEL_STATE_V01
El plugin publica un snapshot estructurado del modelo activo aproximadamente cada 10 segundos y después de una modificación exitosa.

El snapshot contiene:
- modelo activo: título, path, guid, estado modificado y unidades;
- grupos y ocurrencias de componentes;
- jerarquía mediante `entity_key` y `parent_key`;
- `persistent_id` de SketchUp;
- nombre, definición, tag y material;
- bounding box en mm;
- transformación local respecto del padre;
- selección de grupos/componentes;
- materiales, tags y escenas;
- `snapshot_version` y `captured_at`.

No incluye todavía caras y aristas individuales.

### Identidad de ocurrencia
`persistent_id` identifica la entidad SketchUp, pero una entidad dentro de una definición de componente puede aparecer en múltiples ocurrencias. Para lectura jerárquica se usa `entity_key`, formado por la ruta de ocurrencias.

Ejemplo:
```text
8132/419/772
```

Para `GET_ENTITY` y `GET_CHILDREN`, preferir `entity_key` cuando exista anidamiento o componentes repetidos. Si un `persistent_id` resulta ambiguo, el backend devuelve `ENTITY_AMBIGUOUS_USE_ENTITY_KEY`.

### GET_MODEL_SUMMARY
Devuelve orientación compacta del modelo, conteos, entidades top-level, selección y versión del snapshot.

### FIND_ENTITIES
Busca en Redis por nombre, nombre de definición, tag o material. Puede filtrar por `group` o `component_instance` y limita la respuesta a máximo 100 elementos.

### GET_ENTITY
Devuelve una ocurrencia concreta y el número de hijos conocidos.

### GET_CHILDREN
Devuelve los hijos directos de una ocurrencia.

### GET_SELECTION
Devuelve los grupos/componentes seleccionados que están representados en el snapshot.

## Comandos SketchUp de escritura

### create_box
Crea un grupo con un prisma rectangular.

```json
{
  "width_mm": 1000,
  "depth_mm": 1000,
  "height_mm": 1000,
  "origin_mm": [0, 0, 0],
  "name": "Caja"
}
```

### move_entity
Mueve una entidad identificada por `persistent_id`.

```json
{
  "persistent_id": 123,
  "delta_mm": [1000, 0, 0]
}
```

### set_material
Asigna un material a una entidad identificada por `persistent_id`.

```json
{
  "persistent_id": 123,
  "material_name": "Rojo",
  "color_rgb": [255, 0, 0]
}
```

## Estado del bridge
`GET_BRIDGE_STATUS` informa configuración y, cuando existe snapshot, su edad. `plugin_online=true` significa que el último snapshot tiene 30 segundos o menos; no es una garantía absoluta de que una operación futura vaya a completarse.

## Unidades
Las dimensiones geométricas y bounding boxes usan milímetros.

## Límites actuales
Lectura todavía no incluye:
- caras/aristas individuales;
- propiedades detalladas de definiciones;
- cámaras por escena;
- texturas/UV;
- cotas/texto;
- geometría inferida o semántica del negocio.

Escritura todavía no incluye:
- creación/edición general de componentes;
- rotación/escala/copia/borrado;
- escenas/cámaras/tags;
- import/export;
- operaciones booleanas;
- Ruby arbitrario o `eval`.
