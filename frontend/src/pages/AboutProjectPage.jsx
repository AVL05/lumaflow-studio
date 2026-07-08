import { Link } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Panel } from "../components/ui/Panel";

const stack = [
  ["Frontend", "React 19, Vite, React Router 7, Tailwind CSS 4, Recharts, Leaflet"],
  ["Backend", "Laravel 13, PHP 8.3+, Sanctum, PHPUnit, Pint"],
  ["Datos", "MySQL 8, Eloquent, migraciones agrupadas por fase"],
  ["IA", "Ollama local (llama3.1 por defecto), sin proveedores externos"],
  ["Infra", "Docker Compose: frontend, backend, MySQL, phpMyAdmin y Ollama opcional"],
];

const modules = [
  ["Sesiones", "CRUD con cliente, tipo, estado, localizacion, checklists y timeline."],
  ["Biblioteca", "Subida con EXIF automatico, albumes, etiquetas y filtros avanzados."],
  ["Localizaciones", "Mapa Leaflet, coordenadas, acceso, permisos, clima y equipo sugerido."],
  ["Clientes y entregas", "CRM ligero conectado a sesiones, presupuestos y galerias."],
  ["Workflow", "Calendario con drag & drop, tareas, recordatorios y notificaciones."],
  ["Analitica", "KPIs y ocho graficas calculadas sobre datos reales del usuario."],
  ["Asistente IA", "Chat, analisis de fotos, generacion de presets y planes de sesion."],
];

const decisions = [
  [
    "Tokens Bearer en vez de cookies de sesion",
    "La SPA y la API viven en origenes distintos. Sanctum emite tokens personales, CORS no necesita credenciales y el frontend no arrastra estado de sesion.",
  ],
  [
    "404 en vez de 403 para recursos ajenos",
    "Responder 403 confirmaria que el recurso existe. Las policies devuelven false y el controlador lo traduce a 404.",
  ],
  [
    "La IA solo ve datos del usuario",
    "AiContextService arma un contexto compacto y acotado; el prompt de sistema prohibe inventar equipo, clientes o sesiones. El historial se reconstruye del servidor, nunca del cliente.",
  ],
  [
    "Equipo mas utilizado derivado del EXIF",
    "En vez de un contador sintetico, la analitica cruza el EXIF real de las fotografias con el inventario declarado.",
  ],
  [
    "Agregacion en base de datos",
    "La analitica no carga colecciones en memoria: agrupa y cuenta en SQL, y el calendario normaliza cuatro fuentes en un unico shape de evento.",
  ],
  [
    "Ollama es opcional y degrada",
    "Si el modelo local no responde, la API devuelve 503 solo en los endpoints de IA y el resto de la aplicacion sigue funcionando.",
  ],
];

// Placeholders: sustituir por las URL reales antes de publicar el portfolio.
const links = [
  ["GitHub", "https://github.com/AVL05/lumaflow-studio"],
  ["LinkedIn", "https://www.linkedin.com/in/tu-perfil"],
  ["Portfolio", "https://tu-portfolio.example.com"],
];

export function AboutProjectPage() {
  return (
    <div className="min-h-screen bg-[#090908] text-stone-100">
      <header className="border-b border-white/10 px-4 py-5 md:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-200/70">LumaFlow</p>
            <p className="text-sm text-stone-400">Studio</p>
          </div>
          <Link to="/app/dashboard">
            <Button variant="secondary">Entrar a la app</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-12 px-4 py-12 md:px-8">
        <section>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-amber-200/70">
            Sobre el proyecto
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-50">
            Un sistema de gestion completo para fotografos
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-stone-400">
            LumaFlow Studio nace de una pregunta concreta: un fotografo profesional trabaja con
            sesiones, clientes, equipo, presets, localizaciones y miles de archivos, pero suele
            gestionarlo todo en hojas de calculo dispersas. Este proyecto reune ese flujo completo
            en una sola aplicacion full-stack, con un asistente de IA que corre en local y solo
            razona sobre los datos reales del usuario.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-400">
            Es una release privada de portfolio: no busca ser un SaaS, sino demostrar arquitectura,
            criterio tecnico y acabado de producto sobre un dominio con reglas propias.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-100">Tecnologias</h2>
          <div className="mt-5 grid gap-3">
            {stack.map(([area, detail]) => (
              <Panel
                key={area}
                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-baseline sm:gap-6"
              >
                <span className="w-24 shrink-0 text-xs uppercase tracking-[0.16em] text-stone-500">
                  {area}
                </span>
                <span className="text-sm text-stone-300">{detail}</span>
              </Panel>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-100">Arquitectura</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-400">
            Dos aplicaciones independientes. El backend es una API REST pura: cada recurso recorre
            ruta, controlador, form request, modelo con scopes y resource, y la logica de dominio
            vive en servicios. El frontend es una SPA con router, providers de auth y
            notificaciones, hooks compartidos y modulos por dominio. Todo el aislamiento entre
            usuarios se apoya en un scope <code className="text-stone-300">ownedBy</code> y en
            policies que responden 404.
          </p>
          <div className="mt-5 overflow-x-auto">
            <pre className="w-max min-w-full rounded-lg border border-white/10 bg-black/40 p-5 text-xs leading-6 text-stone-400">
              {`routes/api.php  ->  Api\\XController  ->  XRequest (validacion)
                          |
                          v
                   App\\Services\\*  (logica de dominio)
                          |
                          v
                 Modelo + scopes  ->  XResource (serializacion)

frontend/src/api/*.js  ->  hooks  ->  features/<dominio>  ->  pages/`}
            </pre>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-100">Modulos principales</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {modules.map(([name, detail]) => (
              <Card key={name} className="p-5">
                <h3 className="font-medium text-stone-50">{name}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-500">{detail}</p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-100">Integracion de IA</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-400">
            El asistente corre sobre Ollama en la maquina del usuario. Ningun dato sale del equipo.
            Un servicio de contexto arma un resumen compacto de sesiones, equipo, presets, fotos y
            clientes, lo trunca a un presupuesto de tokens y lo entrega junto a un prompt de sistema
            que restringe el ambito a la fotografia y prohibe inventar datos. Las tareas
            estructuradas (generar un preset, planificar una sesion, recomendar equipo) piden JSON
            estricto y se validan contra un esquema antes de persistirse.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "Chat con contexto",
              "Analisis de fotos",
              "Generacion de presets",
              "Planes de sesion",
              "Recomendador de equipo",
            ].map((item) => (
              <Badge key={item} variant="warm">
                {item}
              </Badge>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-100">Decisiones tecnicas</h2>
          <div className="mt-5 space-y-4">
            {decisions.map(([title, rationale]) => (
              <Panel key={title} className="p-5">
                <h3 className="text-sm font-medium text-stone-100">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-500">{rationale}</p>
              </Panel>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-100">Capturas</h2>
          <p className="mt-3 text-sm text-stone-500">
            Pendientes de preparar el material visual del portfolio.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Dashboard",
              "Calendario",
              "Analitica",
              "Biblioteca",
              "Localizaciones",
              "Asistente IA",
            ].map((label) => (
              <div
                key={label}
                className="grid aspect-[16/10] place-items-center rounded-lg border border-dashed border-white/15 bg-white/[0.02] text-xs text-stone-600"
              >
                {label}
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/10 pt-8">
          <h2 className="text-lg font-semibold text-stone-100">Enlaces</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {links.map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary">{label}</Button>
              </a>
            ))}
          </div>
          <p className="mt-4 text-xs text-stone-600">
            LinkedIn y portfolio son marcadores de posicion hasta que existan las URL definitivas.
          </p>
        </section>
      </main>
    </div>
  );
}
