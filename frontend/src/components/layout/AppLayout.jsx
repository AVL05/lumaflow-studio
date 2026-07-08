import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { useAuth } from "../../features/auth/AuthContext";
import { NotificationBell } from "../../features/notifications/NotificationBell";
import { NotificationCenter } from "../../features/notifications/NotificationCenter";
import { GlobalSearch } from "../../features/search/GlobalSearch";

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
  `block rounded-md px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60 ${
    isActive
      ? "bg-stone-100 text-stone-950"
      : "text-stone-400 hover:bg-white/[0.06] hover:text-stone-100"
  }`;

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#090908] text-stone-100">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-stone-100 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-stone-950"
      >
        Saltar al contenido
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-72 overflow-y-auto border-r border-white/10 bg-[#0d0c0b]/95 p-5 lg:flex lg:flex-col">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-200/70">LumaFlow</p>
          <h2 className="mt-2 text-xl font-semibold">Studio</h2>
          <p className="mt-3 text-xs leading-5 text-stone-500">Workflow fotografico profesional.</p>
        </div>

        <nav aria-label="Navegacion principal" className="mt-8 space-y-6">
          {navGroups.map(([group, items]) => (
            <div key={group}>
              <p
                id={`nav-${group}`}
                className="px-3 pb-2 text-[10px] uppercase tracking-[0.2em] text-stone-600"
              >
                {group}
              </p>
              <div className="space-y-1" role="group" aria-labelledby={`nav-${group}`}>
                {items.map(([label, href]) => (
                  <NavLink key={href} to={href} className={navLinkClass}>
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="mt-1 truncate text-xs text-stone-500">{user?.email}</p>
          <Link
            to="/about-project"
            className="mt-3 block text-xs text-amber-200/70 transition hover:text-amber-100"
          >
            Sobre el proyecto
          </Link>
          <Button variant="secondary" className="mt-4 w-full" onClick={handleLogout}>
            Cerrar sesion
          </Button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-[#090908]/85 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Creative workflow</p>
              <p className="truncate text-sm text-stone-300">
                Planifica sesiones, organiza equipo y gestiona biblioteca.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Abrir busqueda global"
                aria-keyshortcuts="Control+K"
                className="hidden items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-stone-400 transition hover:bg-white/[0.08] hover:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60 md:flex"
              >
                Buscar
                <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-stone-400">
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
                  `whitespace-nowrap rounded-md px-3 py-2 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60 ${
                    isActive ? "bg-stone-100 text-stone-950" : "bg-white/[0.04] text-stone-400"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main id="contenido" className="mx-auto max-w-7xl px-4 py-8 md:px-8">
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
