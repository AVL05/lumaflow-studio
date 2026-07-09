# Capa de IA

La experiencia principal de IA corre con **WebGPU en el navegador** mediante WebLLM. Ningun prompt necesita salir a proveedores externos ni requiere claves de API. El backend conserva los servicios de Ollama como compatibilidad local avanzada para quien quiera ejecutar la API de IA desde servidor.

## Cadena

```
frontend/features/ai/webGpuAi.js
   │
   ├─► WebGPU support      detecta `navigator.gpu`
   ├─► WebLLM engine       carga el modelo bajo demanda
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
| `webGpuAi.js` | Inferencia WebGPU en navegador, carga de modelo y parseo JSON |
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
| `VITE_WEBGPU_AI_MODEL` | `Llama-3.2-1B-Instruct-q4f16_1-MLC` | Modelo WebLLM cargado bajo demanda en el navegador |

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

## Limitaciones actuales

- **Primera carga pesada.** El modelo WebLLM se descarga bajo demanda y puede tardar en la primera ejecucion.
- **Dependencia de navegador/hardware.** WebGPU requiere navegador compatible y GPU disponible.
- **Sin vision.** El analisis de fotos razona sobre EXIF y metadata, no sobre pixeles. El prompt lo dice explicitamente.
- Ver [roadmap.md](roadmap.md).
