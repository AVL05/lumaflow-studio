export function DemoBadge({ show }) {
  if (!show) return null;

  return (
    <span className="ml-2 inline-flex items-center rounded-full border border-sky-200/25 bg-sky-400/10 px-2 py-0.5 align-middle text-[11px] font-semibold text-sky-200">
      Ejemplo
    </span>
  );
}
