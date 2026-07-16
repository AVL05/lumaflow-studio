const DEFAULT_MODEL = import.meta.env.VITE_WEBGPU_AI_MODEL || "Llama-3.2-1B-Instruct-q4f16_1-MLC";
const ACTIVE_MODEL_KEY = "lumaflow:webgpu-active-model";

const RECOMMENDED_WEBGPU_MODELS = [
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 1B",
    badge: "Recomendado",
    size: "ligero",
    downloadSize: "0.8-1.2 GB",
    vram: ">= 3 GB",
    profile: "Equilibrado",
    hardware: "Portatil moderno o sobremesa con WebGPU estable.",
    description: "Equilibrado para chat, planificacion y portatiles con GPU modesta.",
  },
  {
    id: "gemma3-1b-it-q4f16_1-MLC",
    name: "Gemma 3 1B",
    badge: "Rapido",
    size: "ligero",
    downloadSize: "0.8-1.2 GB",
    vram: ">= 3 GB",
    profile: "Rapido",
    hardware: "Buen primer modelo para navegadores con memoria ajustada.",
    description: "Buena opcion para respuestas cortas y tareas rapidas con poca memoria.",
  },
  {
    id: "Qwen3-0.6B-q4f16_1-MLC",
    name: "Qwen3 0.6B",
    badge: "Muy ligero",
    size: "muy ligero",
    downloadSize: "0.5-0.8 GB",
    vram: ">= 2 GB",
    profile: "Prueba rapida",
    hardware: "Equipos modestos o validacion inicial de WebGPU.",
    description: "Pensado para probar WebGPU en equipos limitados antes de modelos mayores.",
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 3B",
    badge: "Mas calidad",
    size: "medio",
    downloadSize: "2.0-3.0 GB",
    vram: ">= 6 GB",
    profile: "Calidad",
    hardware: "GPU dedicada o integrada potente; primera carga mas lenta.",
    description: "Mejor razonamiento, a cambio de mas descarga, VRAM y tiempo de carga.",
    warning: "Evitalo en equipos con poca VRAM o navegador inestable con WebGPU.",
  },
  {
    id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
    name: "Phi 3.5 Mini",
    badge: "Analitico",
    size: "medio",
    downloadSize: "2.0-3.0 GB",
    vram: ">= 6 GB",
    profile: "Analitico",
    hardware: "Mejor en GPU dedicada o equipos recientes con memoria suficiente.",
    description: "Alternativa solida para instrucciones estructuradas y planes detallados.",
    warning: "Puede tardar bastante en instalarse la primera vez.",
  },
];

export const WEBGPU_MODELS = RECOMMENDED_WEBGPU_MODELS.some((model) => model.id === DEFAULT_MODEL)
  ? RECOMMENDED_WEBGPU_MODELS
  : [
      {
        id: DEFAULT_MODEL,
        name: DEFAULT_MODEL,
        badge: "Env",
        size: "personalizado",
        downloadSize: "segun modelo",
        vram: "segun modelo",
        profile: "Personalizado",
        hardware: "Depende del modelo configurado.",
        description: "Modelo configurado desde VITE_WEBGPU_AI_MODEL.",
      },
      ...RECOMMENDED_WEBGPU_MODELS,
    ];

let enginePromise = null;
let engineModelId = null;

const SYSTEM_PROMPT = `Eres LumaFlow Studio, un asistente fotografico local.
Responde en español, con criterio profesional y sin inventar datos del usuario.
Si falta contexto, dilo y propone el siguiente paso practico.
Centra tus respuestas en fotografia, sesiones, clientes, equipo y flujo de trabajo.`;

export function getWebGpuSupport() {
  const model = getActiveWebGpuModel();

  if (!("gpu" in navigator)) {
    return {
      available: false,
      provider: "webgpu",
      model,
      error: "WebGPU no esta disponible en este navegador.",
    };
  }

  return {
    available: true,
    provider: "webgpu",
    model,
    error: null,
  };
}

export function getWebGpuModels() {
  return WEBGPU_MODELS;
}

export function getDefaultWebGpuModel() {
  return DEFAULT_MODEL;
}

export function getActiveWebGpuModel() {
  if (typeof window === "undefined") return DEFAULT_MODEL;
  const stored = window.localStorage.getItem(ACTIVE_MODEL_KEY);
  return isKnownModel(stored) ? stored : DEFAULT_MODEL;
}

export function setActiveWebGpuModel(modelId) {
  if (!isKnownModel(modelId)) throw new Error("Modelo WebGPU no reconocido.");
  window.localStorage.setItem(ACTIVE_MODEL_KEY, modelId);
  return modelId;
}

export async function listInstalledWebGpuModels() {
  const { hasModelInCache } = await import("@mlc-ai/web-llm");
  const installed = await Promise.all(
    WEBGPU_MODELS.map(async (model) => ({
      id: model.id,
      installed: await hasModelInCache(model.id),
    })),
  );

  return installed.filter((model) => model.installed).map((model) => model.id);
}

export async function getBrowserStorageEstimate() {
  if (!navigator.storage?.estimate) return null;

  const estimate = await navigator.storage.estimate();
  return {
    quota: estimate.quota ?? 0,
    usage: estimate.usage ?? 0,
    usagePercent:
      estimate.quota && estimate.usage ? Math.round((estimate.usage / estimate.quota) * 100) : 0,
  };
}

export async function installWebGpuModel(modelId, onProgress) {
  await loadWebGpuEngine(onProgress, modelId);
  return setActiveWebGpuModel(modelId);
}

export async function uninstallWebGpuModel(modelId) {
  if (!isKnownModel(modelId)) throw new Error("Modelo WebGPU no reconocido.");

  if (engineModelId === modelId && enginePromise) {
    const engine = await enginePromise;
    await engine.unload();
    enginePromise = null;
    engineModelId = null;
  }

  const { deleteModelAllInfoInCache } = await import("@mlc-ai/web-llm");
  await deleteModelAllInfoInCache(modelId);

  if (getActiveWebGpuModel() === modelId) {
    setActiveWebGpuModel(DEFAULT_MODEL);
  }
}

export async function loadWebGpuEngine(onProgress, modelId = getActiveWebGpuModel()) {
  if (!getWebGpuSupport().available) {
    throw new Error("WebGPU no esta disponible en este navegador.");
  }

  if (!isKnownModel(modelId)) throw new Error("Modelo WebGPU no reconocido.");
  if (enginePromise && engineModelId === modelId) return enginePromise;

  const previousEngine = enginePromise ? await enginePromise : null;
  await previousEngine?.unload();
  engineModelId = modelId;
  enginePromise = import("@mlc-ai/web-llm").then(({ CreateMLCEngine }) =>
    CreateMLCEngine(modelId, {
      initProgressCallback: (progress) => {
        onProgress?.({
          progress: progress.progress ?? 0,
          text: progress.text ?? "Cargando modelo WebGPU...",
        });
      },
    }),
  );

  return enginePromise;
}

export async function runWebGpuChat({ messages, onProgress, signal }) {
  const engine = await loadWebGpuEngine(onProgress);
  throwIfAborted(signal);

  const completion = await engine.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map(({ role, content }) => ({ role, content })),
    ],
    temperature: 0.45,
    stream: true,
  });

  let content = "";
  for await (const chunk of completion) {
    throwIfAborted(signal);
    content += chunk.choices?.[0]?.delta?.content ?? "";
    onProgress?.({ text: "Generando respuesta...", partial: content, progress: 1 });
  }

  return content.trim();
}

export async function runWebGpuJson({ task, payload, schema, onProgress, signal }) {
  const answer = await runWebGpuChat({
    signal,
    onProgress,
    messages: [
      {
        role: "user",
        content: [
          task,
          "Devuelve exclusivamente JSON valido, sin markdown ni explicaciones.",
          `Estructura esperada: ${JSON.stringify(schema)}`,
          `Datos: ${JSON.stringify(payload)}`,
        ].join("\n\n"),
      },
    ],
  });

  return parseJsonAnswer(answer);
}

export function createLocalConversation(current, userContent, assistantContent) {
  const now = Date.now();
  const currentId = String(current?.id ?? "");
  const id = currentId.startsWith("webgpu-") ? current.id : `webgpu-${now}`;

  const messages = [
    ...(current?.messages ?? []),
    { id: `user-${now}`, role: "user", content: userContent },
    { id: `assistant-${now}`, role: "assistant", content: assistantContent },
  ];

  return {
    id,
    provider: "webgpu",
    title: current?.title ?? userContent.slice(0, 60),
    messages,
    messages_count: messages.length,
  };
}

function parseJsonAnswer(answer) {
  try {
    return JSON.parse(answer);
  } catch {
    const match = answer.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("El modelo no devolvio JSON valido.");
    return JSON.parse(match[0]);
  }
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw new DOMException("Operacion cancelada.", "AbortError");
  }
}

function isKnownModel(modelId) {
  return WEBGPU_MODELS.some((model) => model.id === modelId);
}
