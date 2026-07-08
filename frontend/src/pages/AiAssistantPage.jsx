import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { aiApi } from "../api/ai";
import { getApiError } from "../api/client";
import { dashboardApi } from "../api/dashboard";
import { photosApi } from "../api/photos";
import { sessionsApi } from "../api/sessions";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { ErrorState } from "../components/states/ErrorState";
import { AiDashboard } from "../features/ai/AiDashboard";
import { AiHistory } from "../features/ai/AiHistory";
import { AnalysisCard } from "../features/ai/AnalysisCard";
import { AnalysisDetails } from "../features/ai/AnalysisDetails";
import { ChatPanel } from "../features/ai/ChatPanel";
import { ConversationSidebar } from "../features/ai/ConversationSidebar";
import { GearRecommendation } from "../features/ai/GearRecommendation";
import { PresetGenerator } from "../features/ai/PresetGenerator";
import { SessionPlanner } from "../features/ai/SessionPlanner";

export function AiAssistantPage() {
  const [status, setStatus] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [photos, setPhotos] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [photoId, setPhotoId] = useState("");
  const [analysisPrompt, setAnalysisPrompt] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [generatedPreset, setGeneratedPreset] = useState(null);
  const [gearRecommendation, setGearRecommendation] = useState(null);
  const [sessionPlan, setSessionPlan] = useState(null);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  const messages = useMemo(() => activeConversation?.messages ?? [], [activeConversation]);

  const loadConversations = useCallback(async () => {
    try {
      const response = await aiApi.history({ search, per_page: 30 });
      setConversations(response.data);
    } catch {
      setConversations([]);
    }
  }, [search]);

  const loadInitialData = useCallback(async () => {
    setError("");
    try {
      const [statusResponse, dashboardResponse, photoResponse, sessionResponse, historyResponse] =
        await Promise.all([
          aiApi.status(),
          dashboardApi.summary(),
          photosApi.list({ per_page: 80 }),
          sessionsApi.list({ per_page: 80 }),
          aiApi.history({ per_page: 30 }),
        ]);
      setStatus(statusResponse);
      setDashboard(dashboardResponse);
      setPhotos(photoResponse.data);
      setSessions(sessionResponse.data);
      setConversations(historyResponse.data);
    } catch (err) {
      setError(getApiError(err));
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const timer = window.setTimeout(loadConversations, 250);
    return () => window.clearTimeout(timer);
  }, [loadConversations]);

  async function selectConversation(conversation) {
    setError("");
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
    const optimistic = { id: `local-${Date.now()}`, role: "user", content };
    setActiveConversation((current) =>
      current
        ? { ...current, messages: [...current.messages, optimistic] }
        : { title: content, messages: [optimistic] },
    );

    try {
      const response = await aiApi.chat(
        { message: content, conversation_id: activeConversation?.id },
        { signal: abortRef.current.signal },
      );
      setActiveConversation(response.conversation);
      await loadConversations();
    } catch (err) {
      if (err.name !== "CanceledError") setError(getApiError(err, "Ollama no disponible."));
    } finally {
      setLoading("");
      abortRef.current = null;
    }
  }

  async function analyzePhoto(event) {
    event.preventDefault();
    await runAiAction(
      "analysis",
      () =>
        aiApi
          .analyze({ photo_id: Number(photoId), prompt: analysisPrompt || null })
          .then(setAnalysis),
      "No se pudo analizar la foto.",
    );
  }

  async function generatePreset(payload) {
    await runAiAction(
      "preset",
      () => aiApi.preset(payload).then(setGeneratedPreset),
      "No se pudo generar el preset.",
    );
  }

  async function recommendGear(payload) {
    await runAiAction(
      "gear",
      () => aiApi.recommendGear(payload).then(setGearRecommendation),
      "No se pudo recomendar equipo.",
    );
  }

  async function planSession(payload) {
    await runAiAction(
      "plan",
      () => aiApi.sessionPlan(payload).then(setSessionPlan),
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
      setError(getApiError(err, fallback));
    } finally {
      setLoading("");
    }
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
    await aiApi.updateHistory(conversation.id, { title });
    await loadConversations();
    if (activeConversation?.id === conversation.id)
      setActiveConversation((current) => ({ ...current, title }));
  }

  async function deleteConversation(conversation) {
    if (!window.confirm("Eliminar esta conversacion?")) return;
    await aiApi.deleteHistory(conversation.id);
    if (activeConversation?.id === conversation.id) setActiveConversation(null);
    await loadConversations();
  }

  return (
    <>
      <PageHeader
        eyebrow="IA local"
        title="Centro inteligente fotografico"
        description="Ollama integrado para planificar sesiones, analizar fotos, generar presets y recomendar equipo usando solo tus datos."
      />
      {error ? (
        <div className="mb-5">
          <ErrorState message={error} />
        </div>
      ) : null}

      <div className="space-y-6">
        <AiDashboard status={status} dashboard={dashboard} />

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
          <Card className="p-5">
            <h2 className="font-semibold">Analisis inteligente de fotografias</h2>
            <form className="mt-4 space-y-4" onSubmit={analyzePhoto}>
              <Select
                value={photoId}
                onChange={(event) => setPhotoId(event.target.value)}
                options={[
                  { value: "", label: "Selecciona foto" },
                  ...photos.map((photo) => ({
                    value: String(photo.id),
                    label: photo.title || photo.file_name || `Foto ${photo.id}`,
                  })),
                ]}
              />
              <Textarea
                rows="3"
                value={analysisPrompt}
                onChange={(event) => setAnalysisPrompt(event.target.value)}
                placeholder="Objetivo del analisis, estilo buscado o duda concreta"
              />
              <Button disabled={loading === "analysis" || !photoId}>
                {loading === "analysis" ? "Analizando..." : "Analizar fotografia"}
              </Button>
            </form>
            <div className="mt-5">
              <AnalysisCard analysis={analysis} />
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Detalle tecnico</h2>
            <div className="mt-4">
              <AnalysisDetails analysis={analysis} />
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <PresetGenerator
            onGenerate={generatePreset}
            loading={loading === "preset"}
            preset={generatedPreset}
          />
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
