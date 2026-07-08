export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
      <p className="text-sm font-medium text-stone-100">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
