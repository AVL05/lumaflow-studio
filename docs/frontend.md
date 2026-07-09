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
│                  locations, ai, auth, clients, deliveries
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

## Rutas

Todas las rutas de producto cuelgan de `/app/*` bajo `ProtectedRoute` + `AppLayout`. Publicas: `/login`, `/register`, `/about-project`. Cualquier otra ruta cae en `NotFoundPage`, que hace tambien de `errorElement` (sustituye la pantalla de desarrollo de React Router, que filtraba stack traces).

`CalendarPage`, `AnalyticsPage` y `AboutProjectPage` se cargan con `lazyRoute()` para sacar Recharts y el calendario del bundle inicial. Mantener ese patron al anadir paginas pesadas.

## Convenciones

- Componentes `PascalCase.jsx` con **export nombrado**, nunca default.
- Hooks `useThing.js`. Modulos de api por recurso.
- Formato con Prettier (`npm run format`), lint con **oxlint** (no ESLint).
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
npm install
npm run dev
npm run lint          # oxlint
npm run format        # prettier --write src
npm run test          # vitest
npm run test:coverage
npm run build
```
