export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="relative mb-9 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(31,28,23,.82),rgba(11,10,9,.86))] p-6 shadow-[0_24px_80px_rgba(0,0,0,.24)] md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(245,211,141,.12),transparent_24rem)]" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-50 text-balance">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-400 text-pretty">
            {description}
          </p>
        </div>
        {action}
      </div>
    </div>
  );
}
