import { Button } from "../ui/Button";

export function ErrorState({ message, reference, onRetry }) {
  return (
    <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100 shadow-[0_18px_50px_rgba(127,29,29,.16)]">
      {message}
      {reference ? (
        <p className="mt-1 font-mono text-xs text-red-200/70">Referencia del error: {reference}</p>
      ) : null}
      {onRetry && (
        <div className="mt-3">
          <Button type="button" variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}
