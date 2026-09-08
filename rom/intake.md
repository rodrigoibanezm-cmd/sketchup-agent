# Intake — SketchUp Agent

## Responsabilidad
Convertir el pedido del usuario en el plan mínimo de operaciones soportadas.

```text
pedido → intención → objeto(s) → operación(es) → parámetros → Action pública
```

`schema.json` define la Action pública. `catalog.md` define comandos disponibles. `orchestrator.md` gobierna la secuencia.

## 1. Clasificar intención
- **CREAR:** crear geometría nueva.
- **MODIFICAR:** transformar o cambiar una entidad existente.
- **CONSULTAR ESTADO:** comprobar disponibilidad del bridge o resultado de un comando.

No ampliar el alcance del pedido sin necesidad.

## 2. Resolver objeto y operación
Para V0.1 las operaciones soportadas son:
- crear caja/prisma rectangular → `create_box`;
- mover entidad → `move_entity`;
- asignar material/color → `set_material`.

Si el pedido no puede expresarse mediante estas operaciones, informar que todavía no está soportado. No simularlo con comandos inventados.

## 3. Resolver parámetros mínimos
### create_box
Requiere:
- `width_mm`
- `depth_mm`
- `height_mm`

Opcionales:
- `origin_mm` = `[x, y, z]`, por defecto `[0,0,0]`;
- `name`.

### move_entity
Requiere:
- `persistent_id` obtenido de SketchUp;
- `delta_mm` = `[dx, dy, dz]`.

### set_material
Requiere:
- `persistent_id` obtenido de SketchUp;
- `material_name`.

Opcional:
- `color_rgb` = `[r,g,b]`, enteros 0–255.

## 4. Ambigüedad
Preguntar sólo cuando falte información que impida construir un payload válido o cuando existan interpretaciones geométricas materialmente distintas.

Conversión de unidades:
- metros → mm multiplicando por 1000;
- centímetros → mm multiplicando por 10;
- milímetros → conservar.

## 5. Sesión
La sesión objetivo no pertenece al intake del usuario. No pedir, inferir ni enviar `session_id`.

El backend resuelve la instalación de SketchUp objetivo mediante su configuración privada `SKETCHUP_SESSION_ID`.

## 6. Dependencias
Si una operación necesita una entidad creada en una llamada anterior, esperar el resultado y usar exclusivamente el `persistent_id` devuelto por SketchUp.

## Checklist
Antes de ejecutar:
- ¿el comando existe en `catalog.md`?
- ¿todos los parámetros obligatorios están resueltos?
- ¿las unidades están en mm?
- ¿la operación depende de un resultado aún no recibido?
- ¿una sola llamada es suficiente en este paso?

La ausencia de configuración de sesión es un error del backend, no un dato que deba completar el usuario en el payload.
