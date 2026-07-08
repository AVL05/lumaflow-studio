import { Link } from "react-router-dom";

export function AuthShell({ title, description, footer, children }) {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-[#090908] text-stone-100 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden border-r border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(196,141,72,0.22),transparent_26rem)] p-12 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-amber-200/70">
            LumaFlow Studio
          </p>
          <h1 className="mt-8 max-w-xl text-5xl font-semibold leading-tight text-balance">
            El sistema operativo creativo para fotografos modernos.
          </h1>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm text-stone-400">
          {["Sessions", "Gear", "Presets"].map((item) => (
            <div
              key={item}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
      <section className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="text-xs uppercase tracking-[0.24em] text-amber-200/70 lg:hidden"
          >
            LumaFlow Studio
          </Link>
          <h2 className="mt-6 text-3xl font-semibold">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-stone-400">{description}</p>
          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30">
            {children}
          </div>
          <p className="mt-6 text-center text-sm text-stone-500">{footer}</p>
        </div>
      </section>
    </main>
  );
}
