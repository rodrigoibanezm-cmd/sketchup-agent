# Intake — SketchUp Agent

## Responsabilidad
Convertir el pedido del usuario en el plan mínimo de consultas y operaciones soportadas.

```text
pedido → intención → contexto necesario → objeto(s) → operación(es) → parámetros → Action pública
```

`schema.json` define la Action pública. `catalog.md` define consultas y comandos disponibles. `orchestrator.md` gobierna la secuencia.

## 1. Clasificar intención
- **LEER MODELO:** entender qué existe, localizar entidades o inspeccionar selección/jerarquía.
- **CREAR:** crear geometría nueva.
- **MODIFICAR:** transformar o cambiar una entidad existente.
- **CONSULTAR ESTADO:** comprobar disponibilidad del bridge o resultado de un comando.

No ampliar el alcance del pedido sin necesidad.

## 2. Resolver contexto antes de modificar
Si el usuario se refiere a algo que ya existe en el modelo y no existe una referencia inequívoca en contexto:
- orientación general → `GET_MODEL_SUMMARY`;
- localizar por nombre/definición/tag/material → `FIND_ENTITIES`;
- inspeccionar una ocurrencia → `GET_ENTITY`;
- navegar jerarquía → `GET_CHILDREN`;
- "esto", "lo seleccionado", "lo que tengo marcado" → `GET_SELECTION`.

Preferir `entity_key` para ocurrencias anidadas o componentes repetidos.

## 3. Operaciones de escritura actuales
- crear caja/prisma rectangular → `create_box`;
- mover entidad → `move_entity`;
- asignar material/color → `set_material`.

Si el pedido no puede expresarse mediante estas operaciones, informar que todavía no está soportado. No simularlo con comandos inventados.

## 4. Resolver parámetros mínimos
### create_box
Requiere `width_mm`, `depth_mm`, `height_mm`. Opcionales: `origin_mm` y `name`.

### move_entity
Requiere `persistent_id` inequívoco y `delta_mm`.

### set_material
Requiere `persistent_id` inequívoco y `material_name`. Opcional: `color_rgb`.

## 5. Ambigüedad
Antes de preguntarle al usuario por la identidad de una entidad, intentar resolverla con las capabilities de lectura si el modelo puede responderla.

Preguntar sólo cuando:
- la consulta del modelo siga siendo ambigua;
- falte información geométrica necesaria;
- existan interpretaciones materialmente distintas.

Conversión de unidades:
- metros → mm × 1000;
- centímetros → mm × 10;
- milímetros → conservar.

## 6. Sesión
No pedir, inferir ni enviar `session_id`. El backend resuelve la instalación objetivo mediante `SKETCHUP_SESSION_ID`.

## 7. Dependencias
Si una operación necesita una entidad creada o localizada anteriormente, usar exclusivamente los identificadores devueltos por SketchUp/Redis. No inventar `persistent_id` ni `entity_key`.

## Checklist
Antes de responder o ejecutar:
- ¿puedo resolver la referencia consultando el modelo en vez de preguntar?
- ¿el snapshot es suficientemente reciente/completo?
- ¿la entidad es inequívoca?
- ¿la operación existe en `catalog.md`?
- ¿todos los parámetros obligatorios están resueltos?
- ¿las unidades están en mm?
- ¿hay una dependencia aún no resuelta?
