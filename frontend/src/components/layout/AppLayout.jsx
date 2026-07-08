import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { useAuth } from "../../features/auth/AuthContext";

const navItems = [
  ["Dashboard", "/app/dashboard"],
  ["Sesiones", "/app/sessions"],
  ["Equipo", "/app/gear"],
  ["Presets", "/app/presets"],
  ["Álbumes", "/app/albums"],
  ["Clientes", "/app/clients"],
  ["Entregas", "/app/deliveries"],
  ["Localizaciones", "/app/locations"],
  ["Fotos", "/app/photos"],
  ["AI Assistant", "/app/ai-assistant"],
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#090908] text-stone-100">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/10 bg-[#0d0c0b]/95 p-5 lg:flex lg:flex-col">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-200/70">
            LumaFlow
          </p>
          <h2 className="mt-2 text-xl font-semibold">Studio</h2>
          <p className="mt-3 text-xs leading-5 text-stone-500">
            Workflow fotografico profesional.
          </p>
        </div>
        <nav className="mt-8 space-y-1">
          {navItems.map(([label, href]) => (
            <NavLink
              key={href}
              to={href}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-stone-100 text-stone-950"
                    : "text-stone-400 hover:bg-white/[0.06] hover:text-stone-100"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="mt-1 truncate text-xs text-stone-500">{user?.email}</p>
          <Button
            variant="secondary"
            className="mt-4 w-full"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-[#090908]/85 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                Creative workflow
              </p>
              <p className="text-sm text-stone-300">
                Planifica sesiones, organiza equipo y gestiona biblioteca.
              </p>
            </div>
            <div className="lg:hidden">
              <Button variant="secondary" onClick={handleLogout}>
                Salir
              </Button>
            </div>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
            {navItems.map(([label, href]) => (
              <NavLink
                key={href}
                to={href}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-md px-3 py-2 text-xs ${
                    isActive
                      ? "bg-stone-100 text-stone-950"
                      : "bg-white/[0.04] text-stone-400"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
