import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { useAuth } from "../../features/auth/AuthContext";
import { NotificationBell } from "../../features/notifications/NotificationBell";
import { NotificationCenter } from "../../features/notifications/NotificationCenter";
import { GlobalSearch } from "../../features/search/GlobalSearch";
import { usePersistedState } from "../../hooks/usePersistedState";

const navGroups = [
  [
    "Workflow",
    [
      ["Dashboard", "/app/dashboard"],
      ["Calendario", "/app/calendar"],
      ["Tareas", "/app/tasks"],
      ["Recordatorios", "/app/reminders"],
      ["Analitica", "/app/analytics"],
    ],
  ],
  [
    "Produccion",
    [
      ["Sesiones", "/app/sessions"],
      ["Equipo", "/app/gear"],
      ["Presets", "/app/presets"],
      ["Localizaciones", "/app/locations"],
    ],
  ],
  [
    "Biblioteca",
    [
      ["Fotos", "/app/photos"],
      ["Álbumes", "/app/albums"],
    ],
  ],
  [
    "Negocio",
    [
      ["Clientes", "/app/clients"],
      ["Entregas", "/app/deliveries"],
      ["AI Assistant", "/app/ai-assistant"],
    ],
  ],
  ["Sistema", [["Estado", "/app/system"]]],
];

const flatNav = navGroups.flatMap(([, items]) => items);

const navLinkClass = ({ isActive }) =>
  `group relative flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60 ${
    isActive
      ? "bg-amber-100 text-stone-950 shadow-[0_12px_32px_rgba(245,211,141,.14)]"
      : "text-stone-400 hover:bg-white/[0.055] hover:text-stone-100"
  }`;

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = usePersistedState("sidebar-collapsed-groups", {});

  function toggleGroup(group) {
    setCollapsedGroups((current) => ({ ...current, [group]: !current[group] }));
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#090908] text-stone-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_24%_8%,rgba(196,141,72,.1),transparent_30rem),radial-gradient(circle_at_92%_16%,rgba(91,72,49,.12),transparent_26rem)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:52px_52px]" />
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-stone-100 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-stone-950"
      >
        Saltar al contenido
      </a>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-80 overflow-y-auto border-r border-white/10 bg-[#0b0a09]/90 p-5 shadow-[30px_0_80px_rgba(0,0,0,.28)] backdrop-blur-xl lg:flex lg:flex-col">
        <div className="relative shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(31,28,23,.9),rgba(15,14,12,.96))] p-5 shadow-2xl shadow-black/30">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-200/10 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-sm font-bold text-stone-950">
              LF
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-amber-200">LumaFlow</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Studio</h2>
            </div>
          </div>
          <p className="relative mt-4 text-xs leading-5 text-stone-400">
            Suite privada para produccion fotografica, biblioteca y entregas.
          </p>
        </div>

        <nav aria-label="Navegacion principal" className="mt-8 space-y-5">
          {navGroups.map(([group, items]) => {
            const collapsed = Boolean(collapsedGroups[group]);

            return (
              <div key={group}>
                <button
                  type="button"
                  id={`nav-${group}`}
                  onClick={() => toggleGroup(group)}
                  aria-expanded={!collapsed}
                  className="flex w-full items-center justify-between rounded-lg px-3 pb-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-400 transition hover:text-stone-100"
                >
                  {group}
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`}
                  >
                    <path
                      d="M5 7.5 10 12.5 15 7.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {collapsed ? null : (
                  <div className="space-y-1.5" role="group" aria-labelledby={`nav-${group}`}>
                    {items.map(([label, href]) => (
                      <NavLink key={href} to={href} className={navLinkClass}>
                        <span>{label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_18px_60px_rgba(0,0,0,.2)]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.07] text-sm font-semibold text-amber-100">
              {user?.name?.slice(0, 1) ?? "U"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="mt-1 truncate text-xs text-stone-400">{user?.email}</p>
            </div>
          </div>
          <Link
            to="/about-project"
            className="mt-3 block text-xs text-amber-200 transition hover:text-amber-100"
          >
            Sobre el proyecto
          </Link>
          <Button variant="secondary" className="mt-4 w-full" onClick={handleLogout}>
            Cerrar sesion
          </Button>
        </div>
      </aside>

      <div className="relative lg:pl-80">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-[#090908]/72 px-4 py-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
                Creative workflow
              </p>
              <p className="mt-1 truncate text-sm text-stone-200">
                Produccion, clientes, biblioteca e IA local en un solo workspace.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Abrir busqueda global"
                aria-keyshortcuts="Control+K"
                className="hidden items-center gap-3 rounded-xl border border-white/10 bg-white/[0.055] px-3.5 py-2.5 text-sm text-stone-400 shadow-[inset_0_1px_0_rgba(255,255,255,.04)] transition hover:border-amber-200/20 hover:bg-white/[0.09] hover:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60 md:flex"
              >
                Buscar
                <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-xs text-stone-300">
                  Ctrl K
                </kbd>
              </button>
              <NotificationBell onOpen={() => setNotificationsOpen(true)} />
              <div className="lg:hidden">
                <Button variant="secondary" onClick={handleLogout}>
                  Salir
                </Button>
              </div>
            </div>
          </div>
          <nav
            aria-label="Navegacion movil"
            className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden"
          >
            {flatNav.map(([label, href]) => (
              <NavLink
                key={href}
                to={href}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60 ${
                    isActive ? "bg-amber-100 text-stone-950" : "bg-white/[0.055] text-stone-400"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main id="contenido" className="mx-auto max-w-[92rem] px-4 py-8 md:px-8">
          <Outlet />
        </main>
      </div>

      <GlobalSearch
        open={searchOpen}
        onOpen={() => setSearchOpen(true)}
        onClose={() => setSearchOpen(false)}
      />
      <NotificationCenter open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
  );
}
