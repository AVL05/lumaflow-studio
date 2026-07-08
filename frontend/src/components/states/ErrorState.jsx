export function ErrorState({ message }) {
  return (
    <div className="rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
      {message}
    </div>
  );
}
