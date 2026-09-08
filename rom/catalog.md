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

Los endpoints del bridge usados por el plugin son internos a la arquitectura y no forman parte de la superficie del Custom GPT.

## Sesión objetivo
La instalación de SketchUp objetivo se configura en el backend mediante:

```text
SKETCHUP_SESSION_ID
```

`session_id` no forma parte del contrato público del Custom GPT. El agente no debe pedirlo ni enviarlo. El backend lo resuelve antes de escribir el comando en el bridge store.

## Comandos SketchUp V0.1

### create_box
Crea un grupo con un prisma rectangular.

Input `args`:
```json
{
  "width_mm": 1000,
  "depth_mm": 1000,
  "height_mm": 1000,
  "origin_mm": [0, 0, 0],
  "name": "Caja"
}
```

Resultado esperado del plugin:
```json
{
  "ok": true,
  "result": {
    "persistent_id": 123,
    "name": "Caja"
  }
}
```

### move_entity
Mueve una entidad identificada por `persistent_id`.

Input `args`:
```json
{
  "persistent_id": 123,
  "delta_mm": [1000, 0, 0]
}
```

### set_material
Asigna un material a una entidad identificada por `persistent_id`.

Input `args`:
```json
{
  "persistent_id": 123,
  "material_name": "Rojo",
  "color_rgb": [255, 0, 0]
}
```

## Identidad de entidad
`persistent_id` es la referencia operacional devuelta por SketchUp. El agente no debe inventarlo, derivarlo ni sustituirlo por nombres.

## Unidades
Los payloads geométricos usan milímetros.

## Límites V0.1
No están soportados todavía:
- edición arbitraria de caras/aristas;
- componentes;
- escenas/cámaras;
- tags;
- import/export;
- texto/cotas;
- operaciones booleanas;
- Ruby arbitrario o `eval`.

Una operación fuera de este catálogo es `NOT_SUPPORTED`, no una invitación a improvisar otro mecanismo.
