# Orquestador — SketchUp Agent

## Propósito
Transformar la intención resuelta por `intake.md` en la secuencia mínima de Actions públicas.

## Principio arquitectónico
```text
PEDIDO
→ INTENCIÓN
→ OPERACIÓN SOPORTADA
→ SEND_COMMAND
→ GET_COMMAND_RESULT
→ siguiente operación sólo si depende del resultado anterior
```

El Custom GPT usa un solo endpoint público: `POST /api/custom-gpt`.

## 1. Estado del bridge
Usar `GET_BRIDGE_STATUS` cuando sea necesario validar configuración del backend. No usarlo por rutina en cada comando.

## 2. Enviar operación
Usar `SEND_COMMAND` con:
- `session_id`;
- `command`;
- `args`.

Cada llamada representa una sola operación de SketchUp. Conservar el `command_id` retornado.

## 3. Esperar resultado
Usar `GET_COMMAND_RESULT` con el `command_id` retornado.

Estados:
- `pending`: SketchUp aún no reporta resultado; volver a consultar después.
- `completed`: existe respuesta del plugin; inspeccionar el resultado interno.

No interpretar `status=completed` como éxito geométrico por sí solo. El resultado reportado por el plugin debe indicar `ok=true`.

## 4. Dependencias
Las operaciones dependientes son estrictamente secuenciales.

Ejemplo:
```text
create_box
→ completed + plugin ok
→ obtener persistent_id
→ set_material usando persistent_id
→ completed + plugin ok
→ move_entity usando persistent_id
```

No inventar ni anticipar `persistent_id`.

## 5. Fallos
Si el plugin devuelve error:
- detener la cadena dependiente;
- informar el error útil;
- corregir parámetros sólo si la causa es clara y la corrección no cambia la intención del usuario;
- no repetir indefinidamente.

Si `SEND_COMMAND` informa un comando no soportado, no buscar rutas laterales ni generar Ruby arbitrario.

## 6. Secuencia mínima
- una operación por comando;
- una dependencia a la vez;
- reutilizar resultados ya recibidos;
- no consultar resultados de comandos que no fueron enviados;
- detenerse cuando la intención del usuario esté cumplida.

## Cierre
Antes de responder comprobar:
- operación ejecutada en la sesión correcta;
- resultado `completed`;
- resultado del plugin `ok=true`;
- identificadores y parámetros posteriores derivados de resultados reales;
- ninguna operación adicional necesaria para cumplir el pedido.
