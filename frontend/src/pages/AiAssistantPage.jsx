import { useEffect, useMemo, useState } from 'react'
import { aiApi } from '../api/ai'
import { getApiError } from '../api/client'
import { photosApi } from '../api/photos'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { ErrorState } from '../components/states/ErrorState'
import { AnalysisCard } from '../features/ai/AnalysisCard'
import { ChatPanel } from '../features/ai/ChatPanel'

const storageKey = 'lumaflow_ai_history'

export function AiAssistantPage() {
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem(storageKey) || '[]'))
  const [input, setInput] = useState('')
  const [status, setStatus] = useState(null)
  const [photos, setPhotos] = useState([])
  const [photoId, setPhotoId] = useState('')
  const [analysisPrompt, setAnalysisPrompt] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages.slice(-20)))
  }, [messages])

  useEffect(() => {
    aiApi.status().then(setStatus).catch((err) => setError(getApiError(err)))
    photosApi.list({ per_page: 100 }).then((response) => setPhotos(response.data)).catch(() => setPhotos([]))
  }, [])

  const history = useMemo(() => messages.map(({ role, content }) => ({ role, content })), [messages])

  async function submitChat(event) {
    event.preventDefault()
    const content = input.trim()
    if (!content) return

    setInput('')
    setLoading(true)
    setError('')
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', content }])

    try {
      const response = await aiApi.chat({ message: content, history })
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: response.answer }])
    } catch (err) {
      setError(getApiError(err, 'Ollama no disponible.'))
    } finally {
      setLoading(false)
    }
  }

  async function analyzePhoto(event) {
    event.preventDefault()
    setAnalyzing(true)
    setError('')

    try {
      setAnalysis(await aiApi.analyze({ photo_id: Number(photoId), prompt: analysisPrompt || null }))
    } catch (err) {
      setError(getApiError(err, 'No se pudo analizar la foto.'))
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Ollama local"
        title="Asistente IA fotografico"
        description="Asistente especializado. Usa solo datos existentes de tu workspace y evita respuestas fuera del ambito fotografico."
      />
      {error ? <div className="mb-5"><ErrorState message={error} /></div> : null}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ChatPanel messages={messages} input={input} setInput={setInput} onSubmit={submitChat} loading={loading} />
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-semibold">Estado Ollama</h2>
            {!status ? <div className="mt-4"><LoadingSpinner label="Comprobando Ollama..." /></div> : (
              <div className="mt-4 text-sm text-stone-400">
                <p>Estado: <span className={status.available ? 'text-emerald-100' : 'text-red-100'}>{status.available ? 'Disponible' : 'No disponible'}</span></p>
                <p className="mt-2">Modelo: <span className="text-stone-100">{status.model}</span></p>
                {status.error ? <p className="mt-2 text-red-100">{status.error}</p> : null}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Analizar fotografia</h2>
            <form className="mt-4 space-y-4" onSubmit={analyzePhoto}>
              <Select value={photoId} onChange={(event) => setPhotoId(event.target.value)} options={[{ value: '', label: 'Selecciona foto' }, ...photos.map((photo) => ({ value: String(photo.id), label: photo.title || photo.file_name || `Foto ${photo.id}` }))]} />
              <Textarea rows="3" value={analysisPrompt} onChange={(event) => setAnalysisPrompt(event.target.value)} placeholder="Opcional: objetivo del analisis o estilo buscado" />
              <Button disabled={analyzing || !photoId}>{analyzing ? 'Analizando...' : 'Analizar'}</Button>
            </form>
          </Card>

          <AnalysisCard analysis={analysis} />
        </div>
      </div>
    </>
  )
}
