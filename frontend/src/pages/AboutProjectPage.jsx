import { Link } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Panel } from "../components/ui/Panel";

const stack = [
  ["Frontend", "React 19, Vite, React Router 7, Tailwind CSS 4, Recharts, Leaflet"],
  ["Backend", "Laravel 13, PHP 8.3+, Sanctum, Dompdf, PHPUnit, Pint"],
  ["Datos", "MySQL 8, Eloquent, migraciones agrupadas por fase"],
  ["IA", "WebGPU en navegador con WebLLM; Ollama queda como compatibilidad backend opcional"],
  ["Infra", "PWA y Docker Compose: frontend, backend, MySQL, phpMyAdmin y Ollama opcional"],
];

const modules = [
  ["Sesiones", "CRUD con cliente, tipo, estado, localizacion, checklists y timeline."],
  ["Localizaciones", "Mapa Leaflet, coordenadas, acceso, permisos, clima y equipo sugerido."],
  ["Clientes y entregas", "CRM ligero conectado a sesiones, presupuestos y galerias."],
  ["Negocio", "Presupuestos, facturas PDF, vencimientos y estados de cobro."],
  ["Galerias", "Carga multiple, portal privado y seleccion de favoritas del cliente."],
  ["Presets", "Configuraciones de camara vinculadas al inventario real."],
  ["Workflow", "Calendario con drag & drop, tareas y notificaciones."],
  ["Analitica", "KPIs y graficas calculadas sobre datos reales del usuario."],
  ["Asistente IA", "Chat con contexto, planes de sesion y recomendacion de equipo."],
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
    "Agregacion en base de datos",
    "La analitica no carga colecciones en memoria: agrupa y cuenta en SQL, y el calendario normaliza tres fuentes en un unico shape de evento.",
  ],
  [
    "IA local en navegador",
    "La experiencia principal usa WebGPU en el cliente. Si el navegador no lo soporta, la aplicacion informa el limite sin tumbar el resto del producto.",
  ],
];

const links = [
  ["GitHub", "https://github.com/AVL05/lumaflow-studio"],
  ["Portfolio", "https://aleviclop.dev"],
];

export function AboutProjectPage() {
  return (
    <div className="min-h-screen bg-[#090908] text-stone-100">
      <header className="border-b border-white/10 px-4 py-5 md:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-200">LumaFlow</p>
            <p className="text-sm text-stone-300">Studio</p>
          </div>
          <Link to="/app/dashboard">
            <Button variant="secondary">Entrar a la app</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-12 px-4 py-12 md:px-8">
        <section>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-amber-200">
            Sobre el proyecto
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-50">
            Un sistema de gestion completo para fotografos
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-stone-400">
            LumaFlow Studio nace de una pregunta concreta: un fotografo profesional trabaja con
            sesiones, clientes, equipo y localizaciones, pero suele gestionarlo todo en hojas de
            calculo dispersas. Este proyecto reune ese flujo completo en una sola aplicacion
            full-stack, con un asistente de IA que corre en el navegador con WebGPU y solo razona
            sobre los datos reales del usuario.
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
                <span className="w-24 shrink-0 text-xs uppercase tracking-[0.16em] text-stone-400">
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
                <p className="mt-2 text-sm leading-6 text-stone-400">{detail}</p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-100">Integracion de IA</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-400">
            El asistente principal corre con WebGPU en el navegador mediante WebLLM. Ningun prompt
            necesita salir a un proveedor externo. El backend conserva servicios compatibles con
            Ollama para ejecucion local avanzada, pero la experiencia de la SPA no depende de tener
            Ollama instalado.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Chat con contexto", "Planes de sesion", "Recomendador de equipo"].map((item) => (
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
                <p className="mt-2 text-sm leading-6 text-stone-400">{rationale}</p>
              </Panel>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-100">Capturas</h2>
          <p className="mt-3 text-sm text-stone-400">
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
                className="grid aspect-[16/10] place-items-center rounded-lg border border-dashed border-white/15 bg-white/[0.02] text-xs text-stone-400"
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
          <p className="mt-4 text-xs text-stone-400">
            LinkedIn y portfolio son marcadores de posicion hasta que existan las URL definitivas.
          </p>
        </section>
      </main>
    </div>
  );
}
