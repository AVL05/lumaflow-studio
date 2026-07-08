# Capa de IA

El asistente corre sobre **Ollama en local**. Ningun dato sale de la maquina del usuario. No hay proveedores externos ni claves de API.

## Cadena

```
AiController
   │
   ├─► AiContextService     arma un contexto compacto desde los datos del usuario
   │                        y lo trunca a `ollama.max_context`
   │
   ├─► PromptBuilderService system prompt en espanol; para tareas estructuradas
   │                        emite `jsonTask` con `required_schema`
   │
   └─► OllamaService        chat() texto libre
                            json() fuerza `format: json` y reintenta extraer el
                            objeto por regex si el modelo mete ruido
```

## Servicios

| Servicio | Responsabilidad |
|---|---|
| `AiContextService` | Resume sesiones (10), equipo (20), presets (16), fotos (18), albumes (10), localizaciones (16), clientes (12), entregas (12) y etiquetas (30). Si el JSON supera el presupuesto, recorta por bloques hasta encajar |
| `PromptBuilderService` | System prompt y plantillas de tarea |
| `OllamaService` | Transporte HTTP, reintentos, parseo de JSON |
| `PhotoAnalysisService` | Analisis de una foto con su EXIF |
| `PresetGeneratorService` | Genera un preset editable y lo persiste |
| `RecommendationService` | Recomienda equipo existente; lista aparte lo que falta |
| `SessionPlannerService` | Plan de sesion asociado a una sesion real |

## Contrato

**Fallo de Ollama = 503.** `OllamaService` lanza `RuntimeException` cuando el modelo no responde. Cada endpoint de IA lo captura y devuelve HTTP 503 con `{message}`. El resto de la aplicacion sigue operativa. `HealthService` marca el sistema como `degraded`, no como `down`.

**Tareas estructuradas.** `jsonTask` anade al system prompt `"Devuelve exclusivamente JSON valido. Sin markdown."` y pasa un `required_schema`, los rangos numericos y los valores permitidos. Al anadir una tarea nueva: seguir el patron `jsonTask` + un Resource dedicado.

**El system prompt acota el dominio.** Prohibe inventar equipo, clientes, localizaciones, fotografias, sesiones, albumes o presupuestos, y prohibe responder fuera del ambito fotografico.

**El historial no viene del cliente.** `AiChatRequest` acepta solo `message` y `conversation_id`. Los ultimos 12 mensajes se leen de la conversacion persistida. Un cliente no puede inyectar contexto falso.

**No se registran prompts.** `AuditLog::aiFailure()` guarda `operation` y `reason` (`connection_failed`, `http_500`, `invalid_json`), nunca el cuerpo de la peticion ni la respuesta del modelo.

## Configuracion

`config/ollama.php`:

| Variable | Default | Uso |
|---|---|---|
| `OLLAMA_URL` | `http://127.0.0.1:11434` | En Docker: `http://host.docker.internal:11434`, o `http://ollama:11434` con el perfil `ollama` |
| `OLLAMA_MODEL` | `llama3.1` | |
| `OLLAMA_TIMEOUT` | `30` | Timeout de inferencia |
| `OLLAMA_MAX_CONTEXT` | `12000` | Presupuesto de caracteres del contexto |

La sonda de estado (`/api/ai/status`) **no** usa `OLLAMA_TIMEOUT`: tiene un timeout propio de 3 s y se cachea 15 s. Antes, el dashboard esperaba hasta 30 s por carga cuando Ollama estaba caido.

## Rate limiting

`throttle:20,1` sobre `/ai/chat`, `/ai/analyze`, `/ai/preset`, `/ai/session-plan` y `/ai/recommend-gear`. La inferencia local es cara y no debe competir con el resto de la API.

## Limitaciones actuales

- **Sin streaming real.** `streamingAvailable()` devuelve `true`, pero no hay chunked ni SSE. La UI solo simula progresion de la respuesta.
- **Sin vision.** El analisis de fotos razona sobre EXIF y metadata, no sobre pixeles. El prompt lo dice explicitamente.
- Ver [roadmap.md](roadmap.md).
