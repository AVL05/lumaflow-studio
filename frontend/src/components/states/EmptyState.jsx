export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-xl border border-dashed border-amber-100/15 bg-amber-100/[0.025] p-8 text-center">
      <p className="text-sm font-semibold text-stone-100">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-400">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
