import { Card } from '../../components/ui/Card'
import { ChatInput } from './ChatInput'
import { MessageList } from './MessageList'

export function ChatPanel({ messages, input, setInput, onSubmit, loading }) {
  return (
    <Card className="flex min-h-[620px] flex-col p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Asistente fotografico</h2>
        <p className="mt-1 text-sm text-stone-500">Usa solo datos de tu workspace: sesiones, equipo, presets, fotos, albumes y tags.</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-white/10 bg-black/15 p-4">
        <MessageList messages={messages} loading={loading} />
      </div>
      <div className="mt-4">
        <ChatInput value={input} onChange={setInput} onSubmit={onSubmit} disabled={loading} />
      </div>
    </Card>
  )
}
