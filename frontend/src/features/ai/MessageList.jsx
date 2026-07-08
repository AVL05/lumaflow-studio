export function MessageList({ messages, loading }) {
  if (messages.length === 0) {
    return <p className="text-sm text-stone-500">Historial local vacio. Pregunta sobre sesiones, equipo, presets, biblioteca u organizacion.</p>
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message.id} className={message.role === 'user' ? 'ml-auto max-w-[85%] rounded-lg bg-stone-100 p-4 text-stone-950' : 'max-w-[85%] rounded-lg border border-white/10 bg-white/[0.04] p-4 text-stone-200'}>
          <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
        </div>
      ))}
      {loading ? <div className="max-w-[85%] rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-stone-500">Ollama procesando...</div> : null}
    </div>
  )
}
