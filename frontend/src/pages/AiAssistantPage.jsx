import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { aiApi } from "../api/ai";
import { getApiError } from "../api/client";
import { dashboardApi } from "../api/dashboard";
import { sessionsApi } from "../api/sessions";
import { PageHeader } from "../components/ui/PageHeader";
import { ErrorState } from "../components/states/ErrorState";
import { AiDashboard } from "../features/ai/AiDashboard";
import { AiHistory } from "../features/ai/AiHistory";
import { ChatPanel } from "../features/ai/ChatPanel";
import { ConversationSidebar } from "../features/ai/ConversationSidebar";
import { GearRecommendation } from "../features/ai/GearRecommendation";
import { ModelManager } from "../features/ai/ModelManager";
import { SessionPlanner } from "../features/ai/SessionPlanner";
import {
  createLocalConversation,
  getActiveWebGpuModel,
  getBrowserStorageEstimate,
  getWebGpuModels,
  getWebGpuSupport,
  installWebGpuModel,
  listInstalledWebGpuModels,
  runWebGpuChat,
  runWebGpuJson,
  setActiveWebGpuModel,
  uninstallWebGpuModel,
} from "../features/ai/webGpuAi";

const gearSchema = {
  result: {
    camera: "string",
    lenses: ["string"],
    lighting: ["string"],
    accessories: ["string"],
    notes: ["string"],
  },
};

const planSchema = {
  plan: {
    overview: "string",
    timeline: ["string"],
    shotList: ["string"],
    lighting: ["string"],
    risks: ["string"],
    checklist: ["string"],
  },
};

const WEBGPU_HISTORY_KEY = "lumaflow_webgpu_conversations";

export function AiAssistantPage() {
  const [status, setStatus] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [sessions, setSessions] = useState([]);
  const [gearRecommendation, setGearRecommendation] = useState(null);
  const [sessionPlan, setSessionPlan] = useState(null);
  const [loading, setLoading] = useState("");
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState("");
  const [activeModelId, setActiveModelId] = useState(getActiveWebGpuModel);
  const [installedModelIds, setInstalledModelIds] = useState([]);
  const [busyModelId, setBusyModelId] = useState("");
  const [storageEstimate, setStorageEstimate] = useState(null);
  const abortRef = useRef(null);

  const messages = useMemo(() => activeConversation?.messages ?? [], [activeConversation]);
  const webGpuModels = useMemo(() => getWebGpuModels(), []);

  const loadConversations = useCallback(async () => {
    try {
      const response = await aiApi.history({ search, per_page: 30 });
      setConversations(
        filterLocalConversations(readLocalConversations(), search).concat(response.data),
      );
    } catch {
      setConversations(filterLocalConversations(readLocalConversations(), search));
    }
  }, [search]);

  const loadInitialData = useCallback(async () => {
    setError("");
    try {
      const [statusResponse, dashboardResponse, sessionResponse, historyResponse] =
        await Promise.all([
          Promise.resolve(getWebGpuSupport()),
          dashboardApi.summary(),
          sessionsApi.list({ per_page: 80 }),
          aiApi.history({ per_page: 30 }),
        ]);
      setStatus({ ...statusResponse, streaming_supported: true });
      setDashboard(dashboardResponse);
      setSessions(sessionResponse.data);
      setConversations(readLocalConversations().concat(historyResponse.data));
    } catch (err) {
      setError(getApiError(err));
    }
  }, []);

  const refreshInstalledModels = useCallback(async () => {
    try {
      const [installed, storage] = await Promise.all([
        listInstalledWebGpuModels(),
        getBrowserStorageEstimate(),
      ]);
      setInstalledModelIds(installed);
      setStorageEstimate(storage);
    } catch {
      setInstalledModelIds([]);
      setStorageEstimate(null);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    refreshInstalledModels();
  }, [refreshInstalledModels]);

  useEffect(() => {
    const timer = window.setTimeout(loadConversations, 250);
    return () => window.clearTimeout(timer);
  }, [loadConversations]);

  async function selectConversation(conversation) {
    setError("");
    if (isLocalConversation(conversation)) {
      setActiveConversation(conversation);
      return;
    }

    try {
      setActiveConversation(await aiApi.showHistory(conversation.id));
    } catch (err) {
      setError(getApiError(err));
    }
  }

  async function submitChat(event) {
    event.preventDefault();
    const content = input.trim();
    if (!content) return;

    setInput("");
    setError("");
    setLoading("chat");
    abortRef.current = new AbortController();
    const previousConversation = activeConversation;
    const optimistic = { id: `local-${Date.now()}`, role: "user", content };
    setActiveConversation((current) =>
      current
        ? { ...current, messages: [...current.messages, optimistic] }
        : { title: content, messages: [optimistic] },
    );

    try {
      const answer = await runWebGpuChat({
        signal: abortRef.current.signal,
        onProgress: updateWebGpuProgress,
        messages: [...(previousConversation?.messages ?? []), { role: "user", content }],
      });
      const conversation = createLocalConversation(previousConversation, content, answer);
      saveLocalConversation(conversation);
      setActiveConversation(conversation);
      setConversations((current) => upsertConversation(current, conversation));
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message || "WebGPU no disponible.");
    } finally {
      setLoading("");
      setLoadingText("");
      abortRef.current = null;
    }
  }

  async function recommendGear(payload) {
    await runAiAction(
      "gear",
      async () => {
        const result = await runWebGpuJson({
          onProgress: updateWebGpuProgress,
          schema: gearSchema,
          payload,
          task: "Recomienda equipo fotografico practico para esta sesion.",
        });
        setGearRecommendation(result);
      },
      "No se pudo recomendar equipo.",
    );
  }

  async function planSession(payload) {
    await runAiAction(
      "plan",
      async () => {
        const session = sessions.find((item) => item.id === payload.session_id);
        const result = await runWebGpuJson({
          onProgress: updateWebGpuProgress,
          schema: planSchema,
          payload: { ...payload, session },
          task: "Crea un plan de produccion fotografica accionable para esta sesion.",
        });
        setSessionPlan(result);
      },
      "No se pudo generar el plan.",
    );
  }

  async function runAiAction(key, action, fallback) {
    setError("");
    setLoading(key);
    try {
      await action();
      const refreshed = await dashboardApi.summary();
      setDashboard(refreshed);
    } catch (err) {
      setError(err.message || getApiError(err, fallback));
    } finally {
      setLoading("");
      setLoadingText("");
    }
  }

  async function installModel(modelId) {
    setError("");
    setBusyModelId(modelId);
    setLoadingText("Preparando descarga del modelo...");
    try {
      const selectedModel = await installWebGpuModel(modelId, updateWebGpuProgress);
      setActiveModelId(selectedModel);
      await refreshInstalledModels();
      setStatus({ ...getWebGpuSupport(), streaming_supported: true });
    } catch (err) {
      setError(err.message || "No se pudo instalar el modelo WebGPU.");
    } finally {
      setBusyModelId("");
      setLoadingText("");
    }
  }

  async function selectModel(modelId) {
    setError("");
    try {
      const selectedModel = setActiveWebGpuModel(modelId);
      setActiveModelId(selectedModel);
      setStatus({ ...getWebGpuSupport(), streaming_supported: true });
    } catch (err) {
      setError(err.message || "No se pudo activar el modelo WebGPU.");
    }
  }

  async function uninstallModel(modelId) {
    if (!window.confirm("Desinstalar este modelo del navegador?")) return;

    setError("");
    setBusyModelId(modelId);
    setLoadingText("Eliminando modelo local...");
    try {
      await uninstallWebGpuModel(modelId);
      const selectedModel = getActiveWebGpuModel();
      setActiveModelId(selectedModel);
      await refreshInstalledModels();
      setStatus({ ...getWebGpuSupport(), streaming_supported: true });
    } catch (err) {
      setError(err.message || "No se pudo desinstalar el modelo WebGPU.");
    } finally {
      setBusyModelId("");
      setLoadingText("");
    }
  }

  function updateWebGpuProgress(progress) {
    setLoadingText(progress.text || "");
    setStatus((current) => ({
      ...current,
      available: true,
      provider: "webgpu",
      model: getActiveWebGpuModel(),
      loadingText: progress.text,
      streaming_supported: true,
    }));
  }

  function exportMarkdown() {
    const body = messages.map((message) => `## ${message.role}\n\n${message.content}`).join("\n\n");
    const blob = new Blob([body], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeConversation?.title || "lumaflow-ai"}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function renameConversation(conversation) {
    const title = window.prompt("Nuevo nombre", conversation.title);
    if (!title) return;
    if (isLocalConversation(conversation)) {
      const renamed = { ...conversation, title };
      saveLocalConversation(renamed);
      setConversations((current) => upsertConversation(current, renamed));
      if (activeConversation?.id === conversation.id) setActiveConversation(renamed);
      return;
    }

    await aiApi.updateHistory(conversation.id, { title });
    await loadConversations();
    if (activeConversation?.id === conversation.id)
      setActiveConversation((current) => ({ ...current, title }));
  }

  async function deleteConversation(conversation) {
    if (!window.confirm("Eliminar esta conversacion?")) return;
    if (isLocalConversation(conversation)) {
      deleteLocalConversation(conversation.id);
      if (activeConversation?.id === conversation.id) setActiveConversation(null);
      setConversations((current) => current.filter((item) => item.id !== conversation.id));
      return;
    }

    await aiApi.deleteHistory(conversation.id);
    if (activeConversation?.id === conversation.id) setActiveConversation(null);
    await loadConversations();
  }

  return (
    <>
      <PageHeader
        eyebrow="IA local"
        title="Centro inteligente fotografico"
        description="WebGPU ejecuta la IA en tu navegador para planificar sesiones y recomendar equipo usando solo tus datos."
      />
      {error ? (
        <div className="mb-5">
          <ErrorState message={error} />
        </div>
      ) : null}

      <div className="space-y-6">
        <AiDashboard status={{ ...status, loadingText }} dashboard={dashboard} />

        <ModelManager
          models={webGpuModels}
          activeModelId={activeModelId}
          installedModelIds={installedModelIds}
          busyModelId={busyModelId}
          loadingText={loadingText}
          storageEstimate={storageEstimate}
          onInstall={installModel}
          onSelect={selectModel}
          onUninstall={uninstallModel}
        />

        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <ConversationSidebar
            conversations={conversations}
            activeId={activeConversation?.id}
            search={search}
            onSearch={setSearch}
            onNew={() => setActiveConversation(null)}
            onSelect={selectConversation}
            onRename={renameConversation}
            onDelete={deleteConversation}
          />
          <ChatPanel
            conversation={activeConversation}
            messages={messages}
            input={input}
            setInput={setInput}
            onSubmit={submitChat}
            onCancel={() => abortRef.current?.abort()}
            onExportMarkdown={exportMarkdown}
            onPrintPdf={() => window.print()}
            loading={loading === "chat"}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <GearRecommendation
            onRecommend={recommendGear}
            loading={loading === "gear"}
            recommendation={gearRecommendation}
          />
          <SessionPlanner
            sessions={sessions}
            onPlan={planSession}
            loading={loading === "plan"}
            plan={sessionPlan}
          />
        </div>

        <AiHistory items={dashboard?.latestAiRecommendations ?? []} />
      </div>
    </>
  );
}

function readLocalConversations() {
  try {
    const parsed = JSON.parse(localStorage.getItem(WEBGPU_HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalConversation(conversation) {
  const conversations = upsertConversation(readLocalConversations(), conversation);
  localStorage.setItem(WEBGPU_HISTORY_KEY, JSON.stringify(conversations.slice(0, 30)));
}

function deleteLocalConversation(id) {
  const conversations = readLocalConversations().filter((item) => item.id !== id);
  localStorage.setItem(WEBGPU_HISTORY_KEY, JSON.stringify(conversations));
}

function upsertConversation(conversations, conversation) {
  return [conversation, ...conversations.filter((item) => item.id !== conversation.id)];
}

function filterLocalConversations(conversations, search) {
  const term = search.trim().toLowerCase();
  if (!term) return conversations;

  return conversations.filter((conversation) =>
    [conversation.title, ...(conversation.messages ?? []).map((message) => message.content)]
      .join(" ")
      .toLowerCase()
      .includes(term),
  );
}

function isLocalConversation(conversation) {
  return (
    conversation?.provider === "webgpu" || String(conversation?.id ?? "").startsWith("webgpu-")
  );
}
