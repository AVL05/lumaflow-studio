import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../components/branding/BrandLogo";
import { demoAgenda, demoClients, demoPhotos, demoWeek } from "../features/demo/demoData";

const views = [
  ["overview", "Resumen"],
  ["calendar", "Agenda"],
  ["clients", "Clientes"],
  ["delivery", "Entrega"],
];

export function DemoPage() {
  const [activeView, setActiveView] = useState("overview");

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Demo interactiva | LumaFlow Studio";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="min-h-dvh bg-[#090908] text-stone-100">
      <header className="border-b border-white/10 bg-[#0b0a09]">
        <div className="mx-auto flex min-h-16 max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70"
          >
            <BrandLogo className="h-9 w-9 rounded-lg" />
            <span>
              <span className="block text-sm font-semibold">LumaFlow Studio</span>
              <span className="block text-xs text-stone-500">Demo interactiva</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="rounded-lg px-3 py-2 text-sm font-medium text-stone-400 transition hover:bg-white/[0.05] hover:text-stone-100"
            >
              Volver
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-amber-100 px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-stone-50 active:translate-y-px"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      <div className="border-b border-amber-200/15 bg-amber-100/[0.06] px-4 py-2.5 text-center text-xs text-amber-100">
        Modo demostración. Todos los nombres, importes y trabajos son ficticios. Ningún cambio se
        guarda.
      </div>

      <div className="mx-auto grid max-w-[1500px] grid-cols-[minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="min-w-0 overflow-hidden border-b border-white/10 bg-[#0b0a09] p-4 lg:min-h-[calc(100dvh-105px)] lg:border-b-0 lg:border-r lg:p-5">
          <nav
            aria-label="Secciones de la demo"
            className="flex w-full min-w-0 gap-2 overflow-x-auto lg:block lg:space-y-2"
          >
            {views.map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={activeView === id}
                onClick={() => setActiveView(id)}
                className={`shrink-0 rounded-lg px-4 py-2.5 text-left text-sm font-semibold transition lg:w-full ${
                  activeView === id
                    ? "bg-amber-100 text-stone-950"
                    : "text-stone-400 hover:bg-white/[0.055] hover:text-stone-100"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-8 hidden rounded-xl border border-white/10 bg-white/[0.03] p-4 lg:block">
            <p className="text-xs font-semibold text-stone-300">Estudio Prisma</p>
            <p className="mt-2 text-xs leading-5 text-stone-500">
              Cuenta ficticia preparada para explorar el flujo sin configuración previa.
            </p>
          </div>
        </aside>

        <main id="demo-content" className="min-w-0 p-4 sm:p-6 lg:p-8">
          {activeView === "overview" ? <DemoOverview onNavigate={setActiveView} /> : null}
          {activeView === "calendar" ? <DemoCalendar /> : null}
          {activeView === "clients" ? <DemoClients /> : null}
          {activeView === "delivery" ? <DemoDelivery /> : null}
        </main>
      </div>
    </div>
  );
}

function DemoHeader({ eyebrow, title, description }) {
  return (
    <header className="mb-7 rounded-2xl border border-white/10 bg-[linear-gradient(145deg,#171510,#0f0e0c)] p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-50 sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-400">{description}</p>
    </header>
  );
}

function DemoOverview({ onNavigate }) {
  const metrics = [
    ["Sesiones activas", "4", "Dos esta semana"],
    ["Clientes", "18", "Tres con trabajo abierto"],
    ["Facturado", "4.850 €", "Mes actual"],
    ["Entregas", "3", "Una espera aprobación"],
  ];

  return (
    <>
      <DemoHeader
        eyebrow="Vista general"
        title="Tu estudio, hoy"
        description="Una lectura rápida de producción, negocio y entregas pendientes."
      />
      <section
        aria-label="Métricas del estudio"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map(([label, value, detail]) => (
          <article key={label} className="rounded-xl border border-white/10 bg-[#11100e] p-5">
            <p className="text-xs font-medium text-stone-500">{label}</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-stone-50">{value}</p>
            <p className="mt-2 text-xs text-stone-400">{detail}</p>
          </article>
        ))}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-xl border border-white/10 bg-[#11100e] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Agenda de hoy</h2>
            <button
              type="button"
              onClick={() => onNavigate("calendar")}
              className="text-sm font-medium text-amber-200 hover:text-amber-100"
            >
              Abrir agenda
            </button>
          </div>
          <div className="mt-5 space-y-3">
            {demoAgenda.map((event) => (
              <article
                key={event.id}
                className="grid gap-2 rounded-lg border border-white/8 bg-white/[0.025] p-4 sm:grid-cols-[64px_1fr_auto] sm:items-center"
              >
                <p className="font-mono text-sm text-amber-100">{event.time}</p>
                <div>
                  <p className="text-sm font-semibold text-stone-100">{event.title}</p>
                  <p className="mt-1 text-xs text-stone-500">{event.client}</p>
                </div>
                <span className="w-fit rounded-md bg-white/[0.06] px-2 py-1 text-xs text-stone-300">
                  {event.status}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#11100e] p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Trabajo en curso</h2>
          <div className="mt-5 space-y-5">
            {[
              ["Retrato editorial", "Preparación", "Clara Montiel"],
              ["Campaña de interiores", "Presupuesto", "Atelier Norte"],
              ["Boda en La Granja", "Entrega", "Marta y Dani"],
            ].map(([title, status, client]) => (
              <div key={title} className="border-l-2 border-amber-200/45 pl-4">
                <p className="text-sm font-semibold text-stone-100">{title}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {client} · {status}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function DemoCalendar() {
  const [selectedDay, setSelectedDay] = useState(1);
  const selected = demoWeek[selectedDay];

  return (
    <>
      <DemoHeader
        eyebrow="Planificación"
        title="Agenda de la semana"
        description="Selecciona un día para revisar las sesiones, tareas y entregas programadas."
      />
      <section className="grid gap-3 md:grid-cols-5" aria-label="Días de la semana">
        {demoWeek.map((day, index) => (
          <button
            key={day.day}
            type="button"
            aria-pressed={selectedDay === index}
            onClick={() => setSelectedDay(index)}
            className={`rounded-xl border p-4 text-left transition ${
              selectedDay === index
                ? "border-amber-200/40 bg-amber-100 text-stone-950"
                : "border-white/10 bg-[#11100e] text-stone-300 hover:border-white/20"
            }`}
          >
            <span className="block text-xs font-semibold">{day.day}</span>
            <span className="mt-3 block text-3xl font-semibold">{day.date}</span>
            <span
              className={`mt-3 block text-xs ${selectedDay === index ? "text-stone-700" : "text-stone-500"}`}
            >
              {day.events.length} {day.events.length === 1 ? "evento" : "eventos"}
            </span>
          </button>
        ))}
      </section>
      <section className="mt-5 rounded-xl border border-white/10 bg-[#11100e] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
          {selected.day} {selected.date}
        </p>
        <h2 className="mt-3 text-2xl font-semibold">Plan del día</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {selected.events.map((event, index) => (
            <article key={event} className="rounded-lg border border-white/8 bg-white/[0.025] p-4">
              <p className="font-mono text-xs text-stone-500">{index === 0 ? "10:00" : "16:30"}</p>
              <p className="mt-3 text-sm font-semibold">{event}</p>
              <p className="mt-2 text-xs text-stone-500">Datos ficticios para la demostración</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function DemoClients() {
  const [selectedId, setSelectedId] = useState(demoClients[0].id);
  const selected = demoClients.find((client) => client.id === selectedId);

  return (
    <>
      <DemoHeader
        eyebrow="Relación comercial"
        title="Clientes y trabajos conectados"
        description="Selecciona un cliente para consultar su actividad, facturación y próximo paso."
      />
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="space-y-3" aria-label="Clientes ficticios">
          {demoClients.map((client) => (
            <button
              key={client.id}
              type="button"
              aria-pressed={selectedId === client.id}
              onClick={() => setSelectedId(client.id)}
              className={`w-full rounded-xl border p-5 text-left transition ${
                selectedId === client.id
                  ? "border-amber-200/35 bg-amber-100/[0.08]"
                  : "border-white/10 bg-[#11100e] hover:border-white/20"
              }`}
            >
              <span className="block text-sm font-semibold text-stone-100">{client.name}</span>
              <span className="mt-1 block text-xs text-stone-500">{client.company}</span>
              <span className="mt-4 block text-xs text-amber-200">{client.status}</span>
            </button>
          ))}
        </section>
        <section className="rounded-xl border border-white/10 bg-[#11100e] p-6 sm:p-8">
          <p className="text-xs text-stone-500">Ficha del cliente</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">{selected.name}</h2>
          <p className="mt-2 text-sm text-stone-400">{selected.company}</p>
          <dl className="mt-8 grid gap-5 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-stone-500">Trabajos</dt>
              <dd className="mt-2 text-2xl font-semibold">{selected.jobs}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">Facturado</dt>
              <dd className="mt-2 text-2xl font-semibold">{selected.billed}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">Estado</dt>
              <dd className="mt-2 text-sm font-semibold text-amber-200">{selected.status}</dd>
            </div>
          </dl>
          <div className="mt-8 rounded-lg border border-white/8 bg-white/[0.025] p-4">
            <p className="text-xs font-semibold text-stone-300">Próximo paso</p>
            <p className="mt-2 text-sm text-stone-400">{selected.next}</p>
          </div>
          <p className="mt-6 text-sm leading-6 text-stone-400">{selected.note}</p>
        </section>
      </div>
    </>
  );
}

function DemoDelivery() {
  const [photos, setPhotos] = useState(demoPhotos);
  const favoriteCount = photos.filter((photo) => photo.favorite).length;

  function toggleFavorite(id) {
    setPhotos((current) =>
      current.map((photo) => (photo.id === id ? { ...photo, favorite: !photo.favorite } : photo)),
    );
  }

  return (
    <>
      <DemoHeader
        eyebrow="Portal del cliente"
        title="Galería para revisar y aprobar"
        description="Marca fotografías como favoritas para probar una entrega privada desde la perspectiva del cliente."
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#11100e] p-4">
        <div>
          <p className="text-sm font-semibold">Retrato editorial de Clara</p>
          <p className="mt-1 text-xs text-stone-500">Selección ficticia · 6 fotografías</p>
        </div>
        <p aria-live="polite" className="text-sm font-semibold text-amber-200">
          {favoriteCount} favoritas
        </p>
      </div>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3" aria-label="Galería ficticia">
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            aria-pressed={photo.favorite}
            aria-label={`${photo.favorite ? "Quitar" : "Añadir"} ${photo.name} de favoritas`}
            onClick={() => toggleFavorite(photo.id)}
            className="group overflow-hidden rounded-xl border border-white/10 bg-[#11100e] text-left transition hover:border-amber-200/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70"
          >
            <span
              className={`block aspect-[4/3] bg-gradient-to-br ${photo.tone} transition duration-300 group-hover:scale-[1.02]`}
            />
            <span className="flex items-center justify-between gap-3 p-3 text-xs">
              <span className="text-stone-400">{photo.name}</span>
              <span className={photo.favorite ? "text-amber-200" : "text-stone-600"}>
                {photo.favorite ? "Favorita" : "Seleccionar"}
              </span>
            </span>
          </button>
        ))}
      </section>
    </>
  );
}
