# Estrategia de pruebas

LumaFlow combina tres niveles de pruebas. Cada uno cubre una capa distinta y ninguno sustituye a los demas.

| Nivel                            | Herramienta                        | Cubre                                                              | Comando              |
| -------------------------------- | ---------------------------------- | ------------------------------------------------------------------ | -------------------- |
| Backend (feature/unit)           | PHPUnit                            | API, validacion, autorizacion, servicios y consultas               | `pnpm run test:backend`  |
| Frontend (componentes/hooks)     | Vitest + Testing Library           | Comportamiento de hooks, utilidades, formularios y componentes     | `pnpm run test:frontend` |
| Recorridos criticos (E2E)       | Playwright                         | Flujos de usuario sobre SPA + API reales                           | `pnpm run test:e2e`      |

Las pruebas unitarias y de componentes son necesarias para iterar rapido; los recorridos E2E existen para confirmar que el flujo completo sigue funcionando entre las dos aplicaciones.

## Suite E2E

`e2e/` es un paquete del workspace de pnpm que ejecuta Playwright contra un entorno de pruebas propio. No usa Docker ni una base de datos compartida con desarrollo: crea un archivo SQLite local, arranca el backend con el servidor integrado de PHP y el frontend con el servidor de desarrollo de Vite, y los apaga al terminar.

### Recorridos cubiertos

| Recorrido                                                            | Archivo                     | Qué valida                                                                                                     |
| -------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Alta y acceso de un estudio                                         | `e2e/tests/auth.spec.js`    | Registro, verificacion de email por enlace firmado, onboarding, primer trabajo, login valido y login erroneo      |
| Alta comercial: cliente, trabajo y sesion                            | `e2e/tests/workflow.spec.js`| Los tres modulos conectados usando el pipeline real de la interfaz                                              |
| Portal de entrega                                                   | `e2e/tests/deliveries.spec.js` | Creacion de entrega, apertura del portal publico sin sesion, aprobacion del cliente y reflejo en el panel      |
| Aislamiento entre estudios                                          | `e2e/tests/isolation.spec.js` | Un segundo estudio recibe `404` al leer, modificar y borrar recursos ajenos, y la interfaz no filtra su nombre |

### Ejecutar

```bash
pnpm run test:e2e          # suite completa en modo headless
pnpm run test:e2e:ui       # modo interactivo con inspector
pnpm run test:e2e:report   # abre el ultimo informe HTML
pnpm run test:e2e:install  # descarga el navegador Chromium de Playwright
```

La primera ejecucion necesita el navegador. Si falla con un error de ejecutable ausente:

```bash
pnpm run test:e2e:install
```

### Entorno de pruebas

`e2e/support/env.js` define todo lo especifico del entorno:

| Elemento                    | Valor por defecto                        | Permite sobrescribir con |
| --------------------------- | ---------------------------------------- | ------------------------ |
| API Laravel                 | `http://127.0.0.1:8001`                  | `E2E_BACKEND_PORT`       |
| SPA de Vite                 | `http://127.0.0.1:5273`                  | `E2E_FRONTEND_PORT`      |
| Base de datos               | `e2e/.tmp/lumaflow-e2e.sqlite`           | —                        |
| Clave de aplicacion         | generada en `e2e/.tmp/app-key`           | —                        |
| Credenciales de la suite    | `e2e/support/accounts.js`                | —                        |

Todo lo generado vive en `e2e/.tmp/` y esta ignorado por git.

El backend se lanza con `php -S` y el router de Laravel en lugar de `php artisan serve`, porque ese ultimo solo reenvia `$_ENV` a su proceso hijo y esa variable suele venir vacia. El entorno (`APP_ENV=e2e`, `DB_CONNECTION=sqlite`, `MAIL_MAILER=log`, `CACHE_STORE=file`, `BCRYPT_ROUNDS=4`, origenes CORS de la SPA) se inyecta de forma explicita en cada proceso PHP.

Antes de ejecutar los tests, el `globalSetup`:

1. ejecuta `php artisan optimize:clear` y `migrate:fresh --seed --seeder=Database\Seeders\E2ESeeder`, de modo que la base solo contiene los datos de la suite;
2. vacia `backend/storage/logs/laravel.log`, porque el enlace de verificacion de email se lee de ese log (`MAIL_MAILER=log`);
3. inicia sesion una vez por cuenta reutilizable y guarda el `storageState` de la SPA.

`Database\Seeders\E2ESeeder` crea cinco estudios ficticios en el dominio reservado `.test`, ya verificados; cuatro configurados y uno (`e2e.nuevo@lumaflow.test`) sin onboarding para el recorrido de primer valor. Las credenciales viven solo en `e2e/support/accounts.js` y llegan al seeder por variables de entorno, para no duplicarlas en dos lenguajes. Solo se registra por UI una vez por ejecucion (el throttle comparte contador por IP en peticiones no autenticadas): el resto de cuentas llegan sembradas.

La cuenta de acceso (`e2e.acceso@lumaflow.test`) es independiente a proposito: el backend mantiene una sesion activa por usuario y cada login invalida los tokens anteriores, asi que el recorrido de login no puede usar la misma cuenta que los fixtures reutilizados.

### Fixtures

`e2e/fixtures/test.js` expone estas paginas, cada una en su propio contexto de navegador:

- `ownerPage`: estudio propietario de los recursos que crea el test.
- `outsiderPage`: segundo estudio, para comprobar aislamiento.
- `guestPage`: cuenta invitada al estudio compartido.
- `newcomerPage`: cuenta nueva a mitad del embudo de onboarding.
- `visitorPage`: ventana sin sesion, para portales publicos.

### Reglas para escribir tests

- **Sin esperas arbitrarias.** No se usan `waitForTimeout`. Las esperas son por estado visible, por URL o por condicion observable con `expect.poll`.
- **Selectores semanticos.** Se prioriza `getByRole`, `getByLabel` y `getByText` sobre clases CSS. El repositorio no usa `data-testid`, y los modales se acotan con `getByRole("dialog")`.
- **Sin datos reales.** Todo se crea dentro del test con identificadores unicos (`Date.now()`), de forma que los tests no dependan del orden de ejecucion y puedan repetirse.
- **Sin backdoors.** Los tests cruzan la interfaz real. Cuando hace falta leer un dato que la UI no expone (por ejemplo el token publico de una entrega), se usa la API autenticada con la sesion de esa misma pagina, no atajos de base de datos.

### Ejecucion en serie

La suite comparte una unica base SQLite, asi que `playwright.config.js` fija `fullyParallel: false` y `workers: 1`. Migrar a una base por test permitiria paralelizar, pero no aporta valor con siete recorridos.

## Integracion en CI

El job `E2E journeys` de `.github/workflows/ci.yml` instala PHP 8.4 con `pdo_sqlite`, Node 22, las dependencias de Composer y del workspace, el navegador Chromium de Playwright y ejecuta `pnpm run test:e2e`. El informe HTML se publica como artefacto cuando falla la suite.

## Como elegir donde probar

| Cambio                                            | Nivel minimo esperado                                   |
| ------------------------------------------------- | ------------------------------------------------------- |
| Regla de validacion o serializacion de la API     | PHPUnit feature test + actualizar `docs/api.md` si cambia el contrato |
| Aislamiento o autorizacion                        | PHPUnit con caso de `404` + recorrido E2E si afecta a la interfaz |
| Hook, utilidad o componente del frontend           | Vitest + Testing Library                                 |
| Flujo de usuario de principio a fin               | Recorrido E2E                                            |
| Correccion de error reproducible                  | Test de regresion en el nivel mas bajo posible y, si rompia un flujo, E2E |
