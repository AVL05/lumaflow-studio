export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-amber-200/70">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-50">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-400">{description}</p>
      </div>
      {action}
    </div>
  );
}
