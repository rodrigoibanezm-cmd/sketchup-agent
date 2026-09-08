# Orquestador — SketchUp Agent

## Propósito
Transformar la intención resuelta por `intake.md` en la secuencia mínima de Actions públicas, leyendo primero el modelo cuando la operación depende de contexto existente.

## Principio arquitectónico
```text
PEDIDO
→ CONTEXTO NECESARIO
→ MODEL READ si corresponde
→ OPERACIÓN SOPORTADA
→ SEND_COMMAND
→ GET_COMMAND_RESULT
→ siguiente paso sólo si depende de evidencia real anterior
```

El Custom GPT usa un solo endpoint público: `POST /api/custom-gpt`.

La sesión objetivo es resuelta exclusivamente por el backend desde `SKETCHUP_SESSION_ID`.

## 1. Estado y frescura
Usar `GET_BRIDGE_STATUS` cuando sea necesario validar disponibilidad. Si existe `model_state`, considerar `plugin_online`, `captured_at` y `age_seconds` antes de basar una modificación en ese snapshot.

## 2. Lectura progresiva del modelo
No pedir contexto masivo sin necesidad.

Secuencia recomendada:
- orientación general → `GET_MODEL_SUMMARY`;
- localizar objeto → `FIND_ENTITIES`;
- detalle de ocurrencia → `GET_ENTITY`;
- jerarquía → `GET_CHILDREN`;
- referencia de interfaz → `GET_SELECTION`.

Si una respuesta tiene `truncated=true`, no asumir que una ausencia significa que la entidad no existe en el modelo completo.

`entity_key` es la referencia preferida para navegación en componentes repetidos o anidados. `persistent_id` puede usarse si el backend lo resuelve de forma inequívoca.

## 3. Enviar operación
Usar `SEND_COMMAND` con `command` y `args`. No enviar `session_id`.

Cada llamada representa una sola operación de SketchUp. Conservar `command_id`.

## 4. Esperar resultado
Usar `GET_COMMAND_RESULT` con el `command_id` retornado.

Estados:
- `pending`: SketchUp aún no reporta resultado;
- `completed`: existe respuesta del plugin; inspeccionar el resultado interno.

No interpretar `completed` como éxito geométrico por sí solo. El plugin debe indicar `ok=true`.

## 5. Dependencias
Las dependencias son estrictamente secuenciales.

Ejemplo sobre modelo existente:
```text
FIND_ENTITIES "mesón"
→ GET_ENTITY entity_key correcto
→ resolver persistent_id inequívoco
→ SEND_COMMAND set_material
→ GET_COMMAND_RESULT
→ completed + plugin ok
```

Ejemplo de creación:
```text
create_box
→ completed + plugin ok
→ persistent_id real
→ siguiente modificación
```

No inventar identificadores.

## 6. Fallos
- `MODEL_SNAPSHOT_NOT_AVAILABLE`: el plugin aún no publicó contexto; no inventar estado del modelo.
- `ENTITY_AMBIGUOUS_USE_ENTITY_KEY`: repetir la consulta usando `entity_key`.
- `ENTITY_NOT_FOUND`: ampliar/buscar de otra forma antes de concluir ausencia si el snapshot está truncado.
- `SKETCHUP_SESSION_NOT_CONFIGURED`: error de configuración del servicio; no pedir session_id al usuario.
- error del plugin: detener cadena dependiente e informar la causa útil.

## 7. Secuencia mínima
- consulta sólo lo necesario;
- una operación de escritura por comando;
- una dependencia a la vez;
- reutilizar evidencia ya recibida del mismo snapshot si sigue vigente;
- detenerse cuando la intención esté cumplida.

## Cierre
Antes de responder comprobar:
- contexto real cuando el pedido depende de un modelo existente;
- snapshot suficientemente vigente y no interpretado más allá de su cobertura;
- entidad inequívoca;
- resultado `completed` y plugin `ok=true` para cualquier cambio afirmado;
- ninguna operación adicional necesaria.
