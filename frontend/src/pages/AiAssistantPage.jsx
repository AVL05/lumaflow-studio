import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
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
import { useAuth } from "../features/auth/AuthContext";
import { autoTitle, buildExport, createLocalAiRepository } from "../features/ai/localAiRepository";
import {
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

export function AiAssistantPage() {
  const location = useLocation();
  const { user } = useAuth();
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
  const [historyRepo, setHistoryRepo] = useState(null);
  const [storageNotice, setStorageNotice] = useState(false);
  const abortRef = useRef(null);

  const messages = useMemo(() => activeConversation?.messages ?? [], [activeConversation]);
  const webGpuModels = useMemo(() => getWebGpuModels(), []);

  useEffect(() => {
    const initialPrompt = location.state?.initialPrompt?.trim();
    if (!initialPrompt) return;
    const pageContext = location.state?.pageContext || "LumaFlow";
    setInput(`Contexto de la pantalla: ${pageContext}.\n\n${initialPrompt}`);
  }, [location.key, location.state]);

  const loadConversations = useCallback(async () => {
    let local = [];
    try {
      if (historyRepo) local = await historyRepo.listConversations();
    } catch {
      local = [];
    }
    try {
      const response = await aiApi.history({ search, per_page: 30 });
      setConversations(filterLocalConversations(local, search).concat(response.data));
    } catch {
      setConversations(filterLocalConversations(local, search));
    }
  }, [search, historyRepo]);

  const loadInitialData = useCallback(async () => {
    setError("");
    try {
      const repository = await createLocalAiRepository({
        userId: user?.id,
        workspaceId: user?.current_workspace_id,
      });
      await repository.migrateLegacy();
      setHistoryRepo(repository);
      setStorageNotice(!repository.persistent);
      const [statusResponse, dashboardResponse, sessionResponse, historyResponse, local] =
        await Promise.all([
          Promise.resolve(getWebGpuSupport()),
          dashboardApi.summary(),
          sessionsApi.list({ per_page: 80 }),
          aiApi.history({ per_page: 30 }).catch(() => ({ data: [] })),
          repository.listConversations(),
        ]);
      setStatus({ ...statusResponse, streaming_supported: true });
      setDashboard(dashboardResponse);
      setSessions(sessionResponse.data);
      setConversations(local.concat(historyResponse.data));
    } catch (err) {
      setError(getApiError(err));
    }
  }, [user?.id, user?.current_workspace_id]);

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
      if (!historyRepo) {
        setActiveConversation(conversation);
        return;
      }
      try {
        setActiveConversation((await historyRepo.getConversation(conversation.id)) ?? conversation);
      } catch (err) {
        setError(getApiError(err, "No se pudo abrir la conversación."));
      }
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
      if (!historyRepo) throw new Error("Historial no disponible.");
      let conversation = previousConversation;
      if (!conversation || !isLocalConversation(conversation)) {
        conversation = await historyRepo.createConversation({
          title: autoTitle(content),
          modelId: activeModelId,
        });
      }
      await historyRepo.appendMessage(conversation.id, { role: "user", content });
      await historyRepo.appendMessage(conversation.id, { role: "assistant", content: answer });
      const stored = await historyRepo.getConversation(conversation.id);
      setActiveConversation(stored);
      setConversations((current) => upsertConversation(current, stored));
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

  function exportJson() {
    if (!activeConversation || messages.length === 0) return;
    const { json } = buildExport(
      {
        title: activeConversation.title,
        modelId: activeConversation.modelId ?? null,
      },
      messages,
    );
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeConversation?.title || "lumaflow-ai"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function renameConversation(conversation) {
    const title = window.prompt("Nuevo nombre", conversation.title);
    if (!title) return;
    if (isLocalConversation(conversation)) {
      if (!historyRepo) return;
      try {
        const renamed = await historyRepo.renameConversation(conversation.id, title);
        const full = await historyRepo.getConversation(renamed.id);
        setConversations((current) => upsertConversation(current, full ?? renamed));
        if (activeConversation?.id === conversation.id) setActiveConversation(full ?? renamed);
      } catch (err) {
        setError(getApiError(err, "No se pudo renombrar."));
      }
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
      if (!historyRepo) return;
      try {
        await historyRepo.deleteConversation(conversation.id);
      } catch (err) {
        setError(getApiError(err, "No se pudo eliminar."));
        return;
      }
      if (activeConversation?.id === conversation.id) setActiveConversation(null);
      setConversations((current) => current.filter((item) => item.id !== conversation.id));
      return;
    }

    await aiApi.deleteHistory(conversation.id);
    if (activeConversation?.id === conversation.id) setActiveConversation(null);
    await loadConversations();
  }

  async function clearHistory() {
    if (!historyRepo) return;
    if (!window.confirm("Borrar todo el historial local de este estudio?")) return;
    setError("");
    try {
      await historyRepo.clearWorkspaceHistory();
      setActiveConversation(null);
      await loadConversations();
    } catch (err) {
      setError(getApiError(err, "No se pudo borrar el historial."));
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Luma"
        title="Asistente del estudio"
        description="IA local con contexto de clientes, producción y de la pantalla desde la que abriste Luma."
      />
      {error ? (
        <div className="mb-5">
          <ErrorState message={error} />
        </div>
      ) : null}

      {storageNotice ? (
        <div className="mb-5">
          <ErrorState message="Tu historial de IA local se guarda en este navegador y no se sincroniza con otros dispositivos. Ahora mismo no se puede persistir: la IA sigue funcionando en esta sesión." />
        </div>
      ) : (
        <p className="mb-5 text-xs text-stone-500">
          Tu historial de IA local se guarda en este navegador y no se sincroniza con otros
          dispositivos.
        </p>
      )}
      {activeConversation?.modelId &&
      activeModelId &&
      activeConversation.modelId !== activeModelId ? (
        <p className="mb-5 text-xs text-stone-500">
          Esta conversación se creó con otro modelo. Puedes seguir leyéndola sin cambiar nada.
        </p>
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
            onClear={clearHistory}
          />
          <ChatPanel
            conversation={activeConversation}
            messages={messages}
            input={input}
            setInput={setInput}
            onSubmit={submitChat}
            onCancel={() => abortRef.current?.abort()}
            onExportMarkdown={exportMarkdown}
            onExportJson={exportJson}
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

function upsertConversation(conversations, conversation) {
  if (!conversation) return conversations;
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
  if (!conversation) return false;
  if (conversation?.provider === "webgpu") return true;
  const id = String(conversation?.id ?? "");
  return id.startsWith("webgpu-") || id.startsWith("local-");
}
