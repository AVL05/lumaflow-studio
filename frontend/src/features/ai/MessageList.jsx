import { MarkdownRenderer } from "./MarkdownRenderer";
import { StreamingMessage } from "./StreamingMessage";

export function MessageList({ messages, loading }) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-stone-400">
        Inicia una conversacion sobre sesiones, equipo, clientes u organizacion.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={message.id}
          className={
            message.role === "user"
              ? "ml-auto max-w-[85%] rounded-lg bg-stone-100 p-4 text-stone-950"
              : "max-w-[85%] rounded-lg border border-white/10 bg-white/[0.04] p-4 text-stone-200"
          }
        >
          {message.role === "user" ? (
            <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
          ) : null}
          {message.role === "assistant" && index === messages.length - 1 ? (
            <StreamingMessage content={message.content} />
          ) : null}
          {message.role === "assistant" && index !== messages.length - 1 ? (
            <MarkdownRenderer content={message.content} />
          ) : null}
        </div>
      ))}
      {loading ? (
        <div className="max-w-[85%] rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-stone-400">
          IA local procesando...
        </div>
      ) : null}
    </div>
  );
}
