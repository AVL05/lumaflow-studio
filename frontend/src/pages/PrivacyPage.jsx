import { Link } from "react-router-dom";
import { MarketingPage } from "../components/marketing/MarketingPage";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

const layers = [
  {
    label: "Tu navegador",
    tone: "border-amber-200/25 bg-amber-100/[0.06]",
    items: [
      "Prompts y respuestas de la IA WebGPU",
      "Modelos descargados y caché local",
      "Historial de conversaciones WebGPU",
    ],
  },
  {
    label: "API de LumaFlow",
    tone: "border-white/10 bg-white/[0.035]",
    items: [
      "Clientes, sesiones y tareas",
      "Presupuestos, facturas y estados",
      "Acceso autenticado y separado por usuario",
    ],
  },
  {
    label: "Almacenamiento de galerías",
    tone: "border-white/10 bg-white/[0.035]",
    items: [
      "Fotografías que decides subir",
      "Archivos en almacenamiento S3 compatible",
      "Acceso del cliente mediante el portal de entrega",
    ],
  },
];

export function PrivacyPage() {
  useDocumentMeta(
    "Privacidad e IA local | LumaFlow",
    "Conoce qué datos guarda LumaFlow, qué permanece en tu navegador y cómo funciona la IA local con WebGPU.",
  );

  return (
    <MarketingPage>
      <section className="mx-auto grid max-w-[1400px] gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.76fr_1.24fr] lg:items-center lg:px-10 lg:py-28">
        <div className="landing-enter max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
            Privacidad e IA local
          </p>
          <h1 className="mt-5 max-w-[11ch] text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-stone-50 sm:text-6xl lg:text-[4.5rem]">
            Tus datos. Tu IA local.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-stone-400 sm:text-lg">
            Una arquitectura clara para saber qué se sincroniza y qué permanece local.
          </p>
        </div>
        <div className="landing-enter landing-enter-delay overflow-hidden rounded-2xl border border-white/10 bg-[#11100e] p-2 shadow-[0_40px_120px_rgba(0,0,0,.5)]">
          <img
            src="/product/ai-assistant.png"
            alt="Gestor de modelos de inteligencia artificial WebGPU en LumaFlow"
            width="1270"
            height="714"
            fetchPriority="high"
            className="marketing-product-crop h-auto rounded-xl border border-white/8"
          />
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#0d0c0b] px-4 py-24 sm:px-6 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-5xl">
              Tres lugares. Tres responsabilidades.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-stone-400">
              Esta es la arquitectura actual de la beta, explicada sin mezclar la IA local con el
              almacenamiento del producto.
            </p>
          </div>
          <div className="mt-14 grid gap-4 lg:grid-cols-[1.15fr_0.95fr_0.95fr]">
            {layers.map((layer, index) => (
              <article
                key={layer.label}
                className={`relative rounded-2xl border p-6 sm:p-8 ${layer.tone}`}
              >
                <p className="font-mono text-xs text-amber-200">0{index + 1}</p>
                <h3 className="mt-5 text-2xl font-semibold text-stone-50">{layer.label}</h3>
                <ul className="mt-7 space-y-4 text-sm leading-6 text-stone-400">
                  {layer.items.map((item) => (
                    <li key={item} className="border-t border-white/10 pt-4">
                      {item}
                    </li>
                  ))}
                </ul>
                {index < layers.length - 1 ? (
                  <span
                    className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#171512] text-xs text-stone-400 lg:flex"
                    aria-hidden="true"
                  >
                    →
                  </span>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1400px] gap-14 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-32">
        <div className="max-w-xl">
          <h2 className="text-4xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-5xl">
            Qué permanece local.
          </h2>
          <p className="mt-5 text-base leading-7 text-stone-400">
            WebLLM descarga el modelo en la caché gestionada por el navegador y genera allí las
            respuestas. El modelo activo y el historial WebGPU se guardan en almacenamiento local.
          </p>
          <div className="mt-9 border-l border-amber-200/35 pl-5">
            <p className="text-sm font-semibold text-stone-100">
              No requiere claves de una API de IA externa
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              La inferencia principal no envía el prompt a OpenAI, Anthropic u otro proveedor
              remoto.
            </p>
          </div>
        </div>
        <div className="max-w-xl lg:pt-20">
          <h2 className="text-4xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-5xl">
            Qué sale del dispositivo.
          </h2>
          <p className="mt-5 text-base leading-7 text-stone-400">
            Los datos necesarios para gestionar el estudio se envían a la API: clientes, sesiones,
            tareas, documentos y estados. Las fotografías solo se suben cuando creas una entrega.
          </p>
          <div className="mt-9 border-l border-white/15 pl-5">
            <p className="text-sm font-semibold text-stone-100">
              Ollama es una opción de compatibilidad
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              Los endpoints heredados pueden usar el servidor Ollama configurado. La experiencia
              WebGPU de la SPA no depende de él.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#0d0c0b] px-4 py-24 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <h2 className="text-4xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-5xl">
            Controles de la beta.
          </h2>
          <dl className="grid gap-8 sm:grid-cols-2">
            {[
              [
                "Acceso por cuenta",
                "La API usa tokens Bearer y cada consulta limita los recursos al usuario autenticado.",
              ],
              [
                "Aislamiento de recursos",
                "Un recurso de otra cuenta responde como no encontrado para no revelar su existencia.",
              ],
              [
                "Conexión cifrada",
                "La configuración de producción exige HTTPS y TLS para la base de datos.",
              ],
              [
                "Registro limitado",
                "Los fallos de IA se auditan sin guardar prompts ni respuestas en los logs.",
              ],
            ].map(([term, description]) => (
              <div key={term} className="border-t border-white/10 pt-5">
                <dt className="text-sm font-semibold text-stone-100">{term}</dt>
                <dd className="mt-2 text-sm leading-6 text-stone-400">{description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="px-4 py-24 text-center sm:px-6 lg:px-10 lg:py-32">
        <h2 className="mx-auto max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-5xl">
          Prueba el flujo sin datos reales.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-stone-400">
          La demo funciona con información ficticia y no necesita una cuenta.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            className="rounded-lg bg-amber-100 px-6 py-3 text-sm font-semibold text-stone-950 hover:bg-stone-50"
            to="/demo"
          >
            Explorar demo
          </Link>
          <Link
            className="rounded-lg border border-white/10 bg-white/[0.045] px-6 py-3 text-sm font-semibold text-stone-100 hover:bg-white/[0.08]"
            to="/register"
          >
            Empezar gratis
          </Link>
        </div>
      </section>
    </MarketingPage>
  );
}
