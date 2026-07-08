export function JsonViewer({ value }) {
  if (!value) return null

  return (
    <pre className="max-h-80 overflow-auto rounded-lg border border-white/10 bg-black/30 p-4 text-xs leading-5 text-stone-300">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}
