const MODEL = import.meta.env.VITE_WEBGPU_AI_MODEL || "Llama-3.2-1B-Instruct-q4f16_1-MLC";

let enginePromise = null;

const SYSTEM_PROMPT = `Eres LumaFlow Studio, un asistente fotografico local.
Responde en español, con criterio profesional y sin inventar datos del usuario.
Si falta contexto, dilo y propone el siguiente paso practico.
Centra tus respuestas en fotografia, sesiones, clientes, equipo, presets, biblioteca y flujo de trabajo.`;

export function getWebGpuSupport() {
  if (!("gpu" in navigator)) {
    return {
      available: false,
      provider: "webgpu",
      model: MODEL,
      error: "WebGPU no esta disponible en este navegador.",
    };
  }

  return {
    available: true,
    provider: "webgpu",
    model: MODEL,
    error: null,
  };
}

export async function loadWebGpuEngine(onProgress) {
  if (!getWebGpuSupport().available) {
    throw new Error("WebGPU no esta disponible en este navegador.");
  }

  enginePromise ??= import("@mlc-ai/web-llm").then(({ CreateMLCEngine }) =>
    CreateMLCEngine(MODEL, {
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
