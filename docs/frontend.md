# Frontend

React 19 + Vite + Tailwind CSS 4. **JavaScript/JSX puro**: no convertir a TypeScript salvo peticion explicita.

## Estructura

```
frontend/src/
├── api/           un modulo por recurso + client.js (unico axios)
├── app/           providers.jsx, router.jsx, lazyRoute.jsx
├── components/
│   ├── ui/        primitivos (Button, Modal, Badge, Tabs, ProgressBar...)
│   ├── states/    Loading / Error / Empty
│   └── layout/    AppLayout
├── features/      UI por dominio: calendar, tasks, checklists, timeline,
│                  notifications, search, analytics, dashboard,
│                  locations, ai, auth, clients, deliveries, gallery
├── hooks/         usePaginatedResource, useResource, useSelection,
│                  useHotkey, useDebouncedValue, usePersistedState
├── pages/         composicion, una por ruta
├── styles/        main.css (tokens de Tailwind v4)
└── test/          setup de Vitest
```

## Capa de API

`api/client.js` es el **unico** axios. `baseURL` = `VITE_API_URL` (default `http://localhost:8000/api`). Un interceptor inyecta `Bearer` desde `localStorage["lumaflow_token"]` y borra el token ante un 401. Todos los mensajes de error pasan por `getApiError(err)`.

Cada modulo de `api/` exporta `{ list, create, update, remove }`. **Ojo al patron de `list`**: con `params` devuelve la respuesta completa (`{data, meta}`); sin `params` devuelve solo `res.data.data`.

## Hooks compartidos

| Hook | Uso |
|---|---|
| `usePaginatedResource(fetcher, initialFilters)` | Base de las paginas de listado. Filtra valores vacios, resetea a `page: 1` al cambiar un filtro, expone `{items, meta, loading, error, updateFilter, setPage, refresh}` |
| `useResource(fetcher)` | Recursos no paginados |
| `useSelection()` | Seleccion multiple para acciones masivas |
| `useHotkey(combo, handler)` | `mod+k`, `shift+n`, `escape`. Ignora campos editables salvo `allowInInput` |
| `useDebouncedValue(value, delay)` | Busqueda incremental |
| `usePersistedState(key, initial)` | Filtros y preferencias en localStorage, prefijo `lumaflow:` |

## Contextos

`main.jsx` → `AppProviders` → `router`.

```
ToastProvider          avisos efimeros
  └── AuthProvider     token, usuario, login/logout
        └── NotificationsProvider   contador global, sondeo cada 60 s
```

`ToastContext` y `NotificationsContext` son cosas distintas: el primero son toasts en memoria, el segundo el centro de notificaciones persistidas en BD.

`AuthContext` conserva tambien `email_verified`, `onboarding_completed` y `getting_started_completed`. `getAuthDestination()` es la unica regla de redireccion: `/verify-email`, `/onboarding`, `/getting-started` o `/app/dashboard`. `ProtectedRoute` aplica la misma secuencia antes de montar el producto.

## Rutas

La ruta `/` muestra la landing publica del producto y `/demo` ofrece una demostracion interactiva con datos ficticios que no consulta la API ni persiste cambios. `/features` presenta casos de uso, `/pricing` explica las condiciones economicas de la beta y `/privacy` documenta visualmente el flujo de datos e IA local; `/security` redirige a esta ultima. El alta continua por `/register` -> `/verify-email` -> `/onboarding` -> `/getting-started` -> `/app/dashboard`. La ultima pantalla permite abrir trabajos, cargar datos de ejemplo persistentes o ir al importador CSV. Todas las rutas de producto cuelgan de `/app/*` bajo `ProtectedRoute` + `AppLayout`, incluidas `/quotes`, `/invoices` y `/presets`. Tambien son publicas `/login`, `/about-project`, `/book/:slug` y `/deliver/:token`. Cualquier otra ruta cae en `NotFoundPage`, que hace tambien de `errorElement`.

`ActivationPanel` muestra progreso 0/5, permite activar reservas o datos de ejemplo y sustituye el checklist por un estado operativo persistente al alcanzar el primer valor real. `ClientImportPanel` acepta CSV con coma o punto y coma, cabeceras españolas o inglesas y una previsualizacion antes de enviar el lote.

## Navegacion y acciones globales

`AppLayout` limita la barra lateral a cuatro destinos principales y tres grupos: Negocio, Produccion y Herramientas. Analitica sigue disponible desde la paleta de comandos, Luma sustituye el acceso fijo a AI Assistant y `/app/system` redirige a `/app/settings/advanced`. La ruta `/app/settings` contiene la configuracion diaria; la infraestructura queda en su seccion avanzada.

En pantallas pequeñas se usa una bottom navigation fija con Inicio, Trabajos, Calendario, Clientes y Mas. `/app/jobs` muestra el pipeline horizontal y `/app/jobs/:id` concentra cliente, negocio, contrato, produccion, tareas, entregas y timeline. `GlobalCreateMenu` navega con `?create=1`; `useCreateIntent` abre el formulario correspondiente incluso si el usuario ya estaba en ese modulo. Los CTA del detalle propagan `job_id` para que los nuevos recursos queden conectados.

`GlobalSearch` combina resultados de negocio con comandos como crear cliente, ir al calendario o abrir configuracion. Conserva navegacion por flechas, Enter, Escape y `Ctrl/Cmd + K`. `LumaAssistant` abre con `Ctrl/Cmd + L`, identifica la ruta activa y entrega ese contexto a `/app/ai-assistant` como prompt inicial. La inferencia sigue siendo local mediante WebGPU cuando el usuario instala un modelo.

Las paginas comerciales usan capturas reales servidas desde `public/product/`, comparten cabecera y pie desde `components/marketing/` y mantienen enlaces directos a autenticacion. No necesitan datos de la API para renderizar.

## PWA

`vite-plugin-pwa` genera manifest y service worker con actualizacion automatica. El shell, estilos e iconos se precargan; el chunk `lib-*` de WebLLM se excluye deliberadamente porque supera 6 MB y debe seguir bajo demanda. Las imagenes visitadas usan una cache runtime acotada a 120 entradas/30 dias.

`CalendarPage`, `AnalyticsPage` y `AboutProjectPage` se cargan con `lazyRoute()` para sacar Recharts y el calendario del bundle inicial. Mantener ese patron al anadir paginas pesadas.

## Convenciones

- Componentes `PascalCase.jsx` con **export nombrado**, nunca default.
- Hooks `useThing.js`. Modulos de api por recurso.
- Formato con Prettier (`pnpm run format`), lint con **oxlint** (no ESLint).
- La UI esta en espanol y sin tildes en muchos strings. Seguir el estilo del archivo que se toca.
- Tailwind v4 via `@tailwindcss/vite`: **no hay `tailwind.config.js`**, los tokens viven en `src/styles/main.css`.

## Detalles con trampa

**`Button` no fija `type`.** Varios formularios usan el boton sin `type` como submit implicito. Fijar `type="button"` por defecto romperia todos los envios.

**Drag & drop es HTML5 nativo**, sin libreria. El calendario mueve eventos con el tipo de dato `application/lumaflow-event` (ver `DayDropZone`); las checklists reordenan items con indices en refs.

**Memoizacion.** `TaskCard` esta envuelta en `memo` porque la seleccion multiple re-renderiza el listado entero. Los handlers que recibe (`onEdit`, `onToggle`) van en `useCallback` para no invalidar la memo.

**`MapView` crea la instancia de Leaflet una sola vez por montaje.** Incluir `center`, `markers` o `zoom` en las dependencias del efecto destruia y recreaba el mapa en cada render, y bajo StrictMode dejaba efectos posteriores operando sobre un mapa ya eliminado.

## Accesibilidad

- Skip link `Saltar al contenido` en `AppLayout`.
- `Modal` gestiona `Escape`, atrapa el foco con Tab/Shift+Tab, lo devuelve al cerrar, bloquea el scroll del body y expone `aria-labelledby`.
- Todos los controles interactivos tienen `focus-visible:ring`.
- Navegaciones etiquetadas con `aria-label`; grupos del sidebar con `aria-labelledby`.
- Tablas y bloques anchos scrollean dentro de su propio contenedor `overflow-x-auto`.

## Comandos

```bash
pnpm install
pnpm run dev
pnpm run lint          # oxlint
pnpm run format        # prettier --write src
pnpm run test          # vitest
pnpm run test:coverage
pnpm run build
```
