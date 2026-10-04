# Capa de IA

La experiencia principal de IA corre con **WebGPU en el navegador** mediante WebLLM. Ningun prompt necesita salir a proveedores externos ni requiere claves de API. El backend conserva los servicios de Ollama como compatibilidad local avanzada para quien quiera ejecutar la API de IA desde servidor.

## Cadena

```
frontend/features/ai/webGpuAi.js
   │
   ├─► WebGPU support      detecta `navigator.gpu`
   ├─► WebLLM engine       instala, cachea y carga el modelo elegido bajo demanda
   ├─► model library       muestra perfil, descarga, VRAM y storage local
   ├─► chat streaming      genera respuesta incremental en cliente
   └─► JSON tasks          pide JSON estricto y extrae el objeto si el modelo mete ruido

Backend opcional:
AiController -> PromptBuilderService -> OllamaService
```

## Servicios

| Servicio | Responsabilidad |
|---|---|
| `AiContextService` | Resume sesiones (10), equipo (20), localizaciones (16), clientes (12) y entregas (12). Si el JSON supera el presupuesto, recorta por bloques hasta encajar |
| `PromptBuilderService` | System prompt y plantillas de tarea |
| `webGpuAi.js` | Inferencia WebGPU en navegador, catalogo de modelos, carga, cache, storage y parseo JSON |
| `OllamaService` | Transporte HTTP, reintentos y parseo de JSON para compatibilidad backend |
| `RecommendationService` | Recomienda equipo existente; lista aparte lo que falta |
| `SessionPlannerService` | Plan de sesion asociado a una sesion real |

## Contrato

**WebGPU requerido en la SPA.** Si `navigator.gpu` no existe, el centro de IA informa que WebGPU no esta disponible en ese navegador. El resto de la aplicacion sigue operativa.

**Fallo de Ollama = 503 en endpoints legacy.** `OllamaService` lanza `RuntimeException` cuando el modelo no responde. Cada endpoint backend de IA lo captura y devuelve HTTP 503 con `{message}`. `HealthService` marca el sistema como `degraded`, no como `down`.

**Tareas estructuradas.** `jsonTask` anade al system prompt `"Devuelve exclusivamente JSON valido. Sin markdown."` y pasa un `required_schema`, los rangos numericos y los valores permitidos. Al anadir una tarea nueva: seguir el patron `jsonTask` + un Resource dedicado.

**El system prompt acota el dominio.** Prohibe inventar equipo, clientes, localizaciones, sesiones o presupuestos, y prohibe responder fuera del ambito fotografico.

**El historial no viene del cliente.** `AiChatRequest` acepta solo `message` y `conversation_id`. Los ultimos 12 mensajes se leen de la conversacion persistida. Un cliente no puede inyectar contexto falso.

**No se registran prompts.** `AuditLog::aiFailure()` guarda `operation` y `reason` (`connection_failed`, `http_500`, `invalid_json`), nunca el cuerpo de la peticion ni la respuesta del modelo.

## Configuracion

`frontend/.env`:

| Variable | Default | Uso |
|---|---|---|
| `VITE_WEBGPU_AI_MODEL` | `Llama-3.2-1B-Instruct-q4f16_1-MLC` | Modelo WebLLM inicial. La SPA permite instalar, activar y desinstalar otros modelos recomendados desde el navegador |

## Gestion de modelos WebGPU

La pantalla de IA muestra una biblioteca local con varios modelos WebLLM recomendados. Cada usuario decide que modelos instalar segun su hardware:

- **Instalar** descarga el modelo real y lo deja cacheado en el navegador.
- **Usar** cambia el modelo activo para chat, planificador y recomendador.
- **Desinstalar** descarga memoria y borra los artefactos cacheados del navegador para ese modelo.
- **Storage local** usa `navigator.storage.estimate()` cuando el navegador lo soporta para mostrar uso y cuota aproximados.

El modelo activo se guarda en `localStorage` y los pesos viven en la cache gestionada por WebLLM. No se suben modelos ni prompts al backend. El **historial de conversaciones WebGPU vive en IndexedDB** (ver sección ADR): `Tu historial de IA local se guarda en este navegador y no se sincroniza con otros dispositivos.` La ruta `/app/ai-assistant` se carga con `React.lazy`, de modo que el resto de la SPA no descarga la interfaz de IA hasta que el usuario entra en ese modulo.

`config/ollama.php`:

| Variable | Default | Uso |
|---|---|---|
| `OLLAMA_URL` | `http://127.0.0.1:11434` | En Docker: `http://host.docker.internal:11434`, o `http://ollama:11434` con el perfil `ollama` |
| `OLLAMA_MODEL` | `llama3.1` | |
| `OLLAMA_TIMEOUT` | `30` | Timeout de inferencia |
| `OLLAMA_MAX_CONTEXT` | `12000` | Presupuesto de caracteres del contexto |

La sonda de estado (`/api/ai/status`) **no** usa `OLLAMA_TIMEOUT`: tiene un timeout propio de 3 s y se cachea 15 s. Solo representa el proveedor backend opcional.

## Rate limiting

`throttle:20,1` sobre `/ai/chat`, `/ai/session-plan` y `/ai/recommend-gear`. La inferencia local es cara y no debe competir con el resto de la API.

## Historial local de conversaciones (ADR)

**Decisión: IndexedDB (opción A).** El contenido completo de las conversaciones WebGPU vive en IndexedDB del navegador (`features/ai/localAiRepository.js`), no en `localStorage` ni en el backend.

Comparativa:

| Criterio | A. IndexedDB (elegida) | B. Backend | C. Híbrida |
|---|---|---|---|
| Privacidad | El contenido no sale del navegador | Persistiría prompts/respuestas en servidor | Sin ventaja sin sync |
| Offline | Funciona sin red ni API | Requiere backend | Igual que A |
| Tamaño/estructura | Cuota amplia, stores + transacciones | Ilimitado pero con coste servidor | Complejidad doble |
| Multi-dispositivo | No (fuera de alcance) | Sí, a cambio de más retención sensible | No requerido |
| Aislamiento cuentas | Namespace por DB | Por membership | — |

Descartado B porque contradice local-first (más superficie de ataque, backups con prompts, retención) y C porque sincronizar está fuera de alcance.

**Qué se guarda:** `conversations{id,title,createdAt,updatedAt,modelId,context{type,resourceId,label},provider}` y `messages{id,conversationId,seq,role,content,createdAt}`. Referencias contextuales mínimas, nunca snapshots de negocio ni prompts de sistema.

**Qué NO se guarda:** binarios de modelos, tokens, secrets, prompts de sistema, datos de otros workspaces.

**Namespace:** una base por cuenta y estudio: `lumaflow-ai:{userId}:{workspaceId}` (IDs internos, nunca email). Otra cuenta en el mismo navegador no ve el historial. Al logout no se borra; `Borrar historial de este estudio` lo elimina con confirmación (conversaciones + mensajes, sin tocar modelos WebGPU ni otros datos).

**Versionado:** schema v1 (`conversations`, `messages` + índice `byConversation`); `onupgradeneeded` idempotente deja puerta a v2.

**IDs:** `crypto.randomUUID()` con fallback local; `seq` transaccional ordena mensajes del mismo milisegundo.

**Fallo:** sin IndexedDB se usa memoria volátil y se avisa discretamente; la IA y LumaFlow siguen funcionando.

**Modelo:** se guarda `modelId`; abrir con otro modelo activo muestra aviso sin bloquear ni descargar nada.

**Exportación:** JSON/Markdown generados en navegador (título, fecha, modelo, mensajes), sin subir nada.

**Limitaciones:** sin sync multi-dispositivo; limpiar datos del navegador borra el historial; textos largos comparten cuota con el resto del origen.

**Backend legacy:** `ai_conversations/messages/plans/analyses` siguen siendo persistencia del modo Ollama (`AiController`), leídas en la SPA solo como compatibilidad (historial antiguo). El modo WebGPU no las escribe ni las necesita.

**Logs:** sin `console.*` de contenido; `AuditLog::aiFailure` solo guarda operación y motivo.

## Limitaciones actuales

- **Primera carga pesada.** El modelo WebLLM se descarga bajo demanda y puede tardar en la primera ejecucion.
- **Almacenamiento local.** Varios modelos instalados pueden ocupar bastante espacio en la cache del navegador.
- **Dependencia de navegador/hardware.** WebGPU requiere navegador compatible y GPU disponible.
- **Sin vision.** El analisis de fotos razona sobre EXIF y metadata, no sobre pixeles. El prompt lo dice explicitamente.
- Ver [roadmap.md](roadmap.md).
