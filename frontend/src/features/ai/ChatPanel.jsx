import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ChatInput } from "./ChatInput";
import { MessageList } from "./MessageList";

export function ChatPanel({
  conversation,
  messages,
  input,
  setInput,
  onSubmit,
  onExportMarkdown,
  onPrintPdf,
  onCancel,
  loading,
}) {
  return (
    <Card className="flex min-h-[620px] flex-col p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            {conversation?.title || "Asistente fotografico"}
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            Planificacion, composicion, iluminacion, edicion y organizacion con tus datos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={onExportMarkdown} disabled={messages.length === 0}>
            Markdown
          </Button>
          <Button type="button" onClick={onPrintPdf} disabled={messages.length === 0}>
            PDF
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-white/10 bg-black/15 p-4">
        <MessageList messages={messages} loading={loading} />
      </div>
      <div className="mt-4">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={onSubmit}
          onCancel={onCancel}
          disabled={loading}
        />
      </div>
    </Card>
  );
}
