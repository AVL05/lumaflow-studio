import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { BrandLogo } from "../branding/BrandLogo";
import { useAuth } from "../../features/auth/AuthContext";
import { LumaAssistant } from "../../features/ai/LumaAssistant";
import { GlobalCreateMenu } from "../../features/navigation/GlobalCreateMenu";
import { NotificationBell } from "../../features/notifications/NotificationBell";
import { NotificationCenter } from "../../features/notifications/NotificationCenter";
import { GlobalSearch } from "../../features/search/GlobalSearch";

const primaryNav = [
  ["Inicio", "/app/dashboard"],
  ["Trabajos", "/app/jobs"],
  ["Calendario", "/app/calendar"],
  ["Clientes", "/app/clients"],
];

const navGroups = [
  ["Negocio", [["Presupuestos", "/app/quotes"], ["Facturas", "/app/invoices"], ["Reservas", "/app/booking-requests"]]],
  ["Producción", [["Sesiones", "/app/sessions"], ["Entregas", "/app/deliveries"], ["Equipo", "/app/gear"], ["Localizaciones", "/app/locations"]]],
  ["Herramientas", [["Tareas", "/app/tasks"], ["Presets", "/app/presets"]]],
];

const pageNames = [...primaryNav, ...navGroups.flatMap(([, items]) => items), ["Configuración", "/app/settings"]];

const navLinkClass = ({ isActive }) =>
  `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60 ${isActive ? "bg-amber-100 text-stone-950 shadow-[0_10px_28px_rgba(245,211,141,.12)]" : "text-stone-400 hover:bg-white/[0.055] hover:text-stone-100"}`;

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [lumaOpen, setLumaOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const currentPage = pageNames.find(([, path]) => location.pathname.startsWith(path))?.[0] ?? "LumaFlow";

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-[100dvh] bg-[#090908] pb-20 text-stone-100 lg:pb-0">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_24%_8%,rgba(196,141,72,.1),transparent_30rem),radial-gradient(circle_at_92%_16%,rgba(91,72,49,.12),transparent_26rem)]" />
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-stone-100 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-stone-950">Saltar al contenido</a>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 overflow-y-auto border-r border-white/10 bg-[#0b0a09]/92 px-4 py-5 shadow-[24px_0_70px_rgba(0,0,0,.24)] backdrop-blur-xl lg:flex lg:flex-col">
        <Link to="/app/dashboard" className="flex items-center gap-3 rounded-xl px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60">
          <BrandLogo className="size-10 rounded-xl" />
          <div><p className="text-sm font-semibold text-stone-50">LumaFlow</p><p className="mt-0.5 text-xs text-stone-500">{user?.studio_name || "Studio"}</p></div>
        </Link>

        <nav aria-label="Navegación principal" className="mt-7">
          <div className="space-y-1">{primaryNav.map(([label, href]) => <NavLink key={href} to={href} className={navLinkClass}>{label}</NavLink>)}</div>
          {navGroups.map(([group, items]) => (
            <div key={group} className="mt-6">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-600">{group}</p>
              <div className="mt-2 space-y-1">{items.map(([label, href]) => <NavLink key={href} to={href} className={navLinkClass}>{label}</NavLink>)}</div>
            </div>
          ))}
        </nav>

        <div className="mt-auto pt-6">
          <NavLink to="/app/settings" className={navLinkClass}>Configuración</NavLink>
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[0.07] text-sm font-semibold text-amber-100">{user?.name?.slice(0, 1) ?? "U"}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{user?.name}</p><Link to="/about-project" className="text-xs text-stone-500 hover:text-amber-100">Sobre LumaFlow</Link></div>
            <button type="button" onClick={handleLogout} className="rounded-lg px-2 py-1.5 text-xs text-stone-500 hover:bg-white/[0.06] hover:text-stone-100">Salir</button>
          </div>
        </div>
      </aside>

      <div className="relative lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-[#090908]/82 px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="flex min-h-12 items-center justify-between gap-3">
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-stone-100">{currentPage}</p><p className="mt-0.5 hidden text-xs text-stone-500 sm:block">{user?.studio_name || "Tu estudio fotográfico"}</p></div>
            <div className="flex shrink-0 items-center gap-2">
              <Button className="whitespace-nowrap" onClick={() => setCreateOpen(true)}>+ Crear</Button>
              <button type="button" onClick={() => setSearchOpen(true)} aria-label="Abrir búsqueda y comandos" aria-keyshortcuts="Control+K" className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-stone-400 hover:border-amber-200/20 hover:bg-white/[0.08] hover:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60 md:flex">Buscar <kbd className="text-xs text-stone-500">Ctrl K</kbd></button>
              <button type="button" onClick={() => setLumaOpen(true)} aria-label="Abrir Luma" aria-keyshortcuts="Control+L" className="flex items-center gap-2 rounded-xl border border-amber-200/15 bg-amber-100/[0.055] p-1.5 pr-3 text-sm font-semibold text-amber-100 hover:border-amber-200/30 hover:bg-amber-100/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60"><BrandLogo className="size-7 rounded-lg" /><span className="hidden sm:inline">Luma</span></button>
              <NotificationBell onOpen={() => setNotificationsOpen(true)} />
            </div>
          </div>
        </header>

        <main id="contenido" className="mx-auto max-w-[92rem] px-4 py-7 md:px-8"><Outlet /></main>
      </div>

      <nav aria-label="Navegación móvil" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-white/10 bg-[#0b0a09]/96 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
        {primaryNav.map(([label, href]) => <MobileLink key={href} label={label} href={href} />)}
        <button type="button" onClick={() => setMoreOpen(true)} className="rounded-lg px-1 py-2 text-xs font-medium text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60">Más</button>
      </nav>

      {moreOpen ? <MobileMore onClose={() => setMoreOpen(false)} onLogout={handleLogout} /> : null}
      <GlobalSearch open={searchOpen} onOpen={() => setSearchOpen(true)} onClose={() => setSearchOpen(false)} onOpenLuma={() => { setSearchOpen(false); setLumaOpen(true); }} />
      <GlobalCreateMenu open={createOpen} onClose={() => setCreateOpen(false)} />
      <LumaAssistant open={lumaOpen} onOpen={() => setLumaOpen(true)} onClose={() => setLumaOpen(false)} />
      <NotificationCenter open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
  );
}

function MobileLink({ label, href }) {
  return <NavLink to={href} className={({ isActive }) => `rounded-lg px-1 py-2 text-center text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60 ${isActive ? "bg-amber-100 text-stone-950" : "text-stone-400"}`}>{label}</NavLink>;
}

function MobileMore({ onClose, onLogout }) {
  return <div className="fixed inset-0 z-[70] flex items-end bg-black/65 lg:hidden" onClick={onClose}><div role="dialog" aria-modal="true" aria-label="Más navegación" className="w-full rounded-t-2xl border-t border-white/10 bg-[#12110f] p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><h2 className="font-semibold">Más</h2><button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-stone-400 hover:bg-white/[0.06]">Cerrar</button></div><div className="mt-3 grid grid-cols-2 gap-2">{navGroups.flatMap(([, items]) => items).map(([label, href]) => <NavLink key={href} to={href} onClick={onClose} className="rounded-xl border border-white/10 p-3 text-sm text-stone-300 hover:bg-white/[0.05]">{label}</NavLink>)}<NavLink to="/app/settings" onClick={onClose} className="rounded-xl border border-white/10 p-3 text-sm text-stone-300 hover:bg-white/[0.05]">Configuración</NavLink><button type="button" onClick={onLogout} className="rounded-xl border border-white/10 p-3 text-left text-sm text-stone-400 hover:bg-white/[0.05]">Cerrar sesión</button></div></div></div>;
}
