export function ErrorState({ message }) {
  return (
    <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100 shadow-[0_18px_50px_rgba(127,29,29,.16)]">
      {message}
    </div>
  );
}
