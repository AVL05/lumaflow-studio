# Backend

Laravel 13, PHP 8.3+, MySQL 8, Sanctum con tokens Bearer.

## Estructura

```
backend/app/
├── Http/
│   ├── Controllers/Api/    un controlador por recurso, delgados
│   ├── Requests/           validacion + reglas de propiedad
│   └── Resources/          serializacion de salida
├── Models/
│   ├── Concerns/           CleansUpWorkflowRelations
│   └── *.php               #[Fillable([...])] como atributo PHP 8
├── Policies/               OwnedResourcePolicy y sus hijas
├── Services/               logica de dominio
└── Support/AuditLog.php    logging de dominio saneado
```

## Convenciones

**Fillable como atributo.** Laravel 13 permite `#[Fillable([...])]` sobre la clase en vez de `protected $fillable`. Todo el proyecto usa la forma de atributo.

**Filtros como scopes.** `scopeOwnedBy`, `scopeSearch`, `scopeStatus`, `scopeType`, `scopePriority`, `scopeBetween`, `scopeOpen`. Se aplican con `->when()` desde el controlador, nunca con `if` anidados.

**Paginacion acotada.** Siempre `paginate(min((int) request('per_page', N), MAX))` para que el cliente no pueda pedir la tabla entera.

**Respuestas JSON.** `bootstrap/app.php` fuerza JSON en `api/*` con `shouldRenderJsonWhen`.

**Autorizacion.** Recursos nuevos usan `$this->authorizeOwnership('update', $model)`, que consulta la policy (autodescubierta por Laravel) y aborta con 404. Preferir esta forma en codigo nuevo.

## Servicios

| Servicio | Responsabilidad |
|---|---|
| `ActivityLogger` | Unica puerta al timeline. Escribe en `activities` con `subject` morfico. |
| `NotificationService` | Notificaciones persistidas. `User::notifications()` sobrescribe deliberadamente la relacion de `Notifiable`, que el proyecto no usa. |
| `CalendarService` | Normaliza sesiones, entregas y tareas al shape `{id: "source-N", source, source_id, date, time, status, meta, url}`. `move()` traduce ese shape al campo de fecha propio de cada modelo. |
| `SearchService` | Busqueda unificada por grupos, con limite por grupo. |
| `AnalyticsService` | KPIs y series. SQL exclusivo de MySQL. |
| `BulkActionService` | `MATRIX` define que accion admite cada recurso; es la fuente de verdad de la validacion. |
| `ExportService` | `COLUMNS` define que se exporta. CSV en streaming, JSON como adjunto. |
| `ChecklistService` | Plantillas, duplicado, reordenacion transaccional. |
| `TaskSummaryService` | Totales de tareas compartidos por dashboard y pagina de tareas. |
| `HealthService` | Sondas de API, MySQL, storage, cache y compatibilidad Ollama. |
| `OnboardingService` | Persiste preferencias iniciales y reserva un slug unico para el estudio. |
| `GettingStartedService` | Persiste la opcion posterior al onboarding y activa la muestra cuando corresponde. |
| `SampleWorkspaceService` | Crea datos ficticios transaccionales e idempotentes para explorar el producto. |
| `ActivationService` | Calcula el checklist 0/5, activa reservas y detecta el primer valor real. |
| `JobWorkflowService` | Expone pipeline y plantillas por especialidad; genera las tareas iniciales. |
| `JobTransitionService` | Avanza trabajos por eventos comerciales y de produccion sin regresiones. |
| `ClientImportService` | Importa clientes en lote y omite duplicados por email dentro del usuario. |
| Cadena de IA | Ver [ai.md](ai.md). |

## Seguridad

- **Rate limiting**: `throttle:10,1` en `/register` y `/login`; `throttle:180,1` en toda la API autenticada; `throttle:20,1` adicional en los endpoints de inferencia.
- **Sesion unica**: `login` borra los tokens previos del usuario antes de emitir uno nuevo.
- **Verificacion de email**: `User` implementa `MustVerifyEmail`; el enlace temporal firmado caduca en 60 minutos.
- **Acceso gradual**: una cuenta sin verificar solo puede consultar su estado, reenviar el email o cerrar sesion. Los recursos de producto exigen tambien onboarding completado.
- **Enumeracion de cuentas**: el error de credenciales es identico exista o no el email.
- **Historial de IA**: no se acepta del cliente. Se reconstruye desde la conversacion persistida para que no se pueda inyectar contexto falso.
- **CORS**: `config/cors.php` lee `FRONTEND_URLS`. `supports_credentials` es `false` porque la SPA usa tokens, no cookies.

## Logging

Canal `lumaflow` (diario, en `storage/logs/lumaflow.log`). Se escribe solo a traves de `App\Support\AuditLog`, que sanea el contexto:

| Evento | Contexto |
|---|---|
| `auth.registered`, `auth.login`, `auth.logout`, `auth.email_verified`, `auth.onboarding_completed` | `user_id` |
| `auth.failed` | `email_hash` (sha256 truncado, nunca el email) |
| `ai.failed` | `operation`, `reason`. Nunca el prompt ni la respuesta. |
| `api.exception` | clase, mensaje, fichero, metodo, ruta, `user_id` |

`bootstrap/app.php` filtra el reporte: los errores de validacion, los de autenticacion y los HTTP 4xx no se registran.

## Comandos

```bash
composer install
php artisan migrate --seed
php artisan storage:link
php artisan serve
php artisan test
php artisan test --filter=AuthTest
vendor/bin/pint            # obligatorio antes de entregar
php artisan route:list --path=api
```

`phpunit.xml` apunta a SQLite en memoria. Si el PHP local no trae `pdo_sqlite`, crear una base MySQL de test y sobrescribir la conexion:

```bash
DB_CONNECTION=mysql DB_DATABASE=lumaflow_studio_testing php artisan test
```

La analitica usa SQL de MySQL, asi que MySQL es tambien el motor de referencia en pruebas.
