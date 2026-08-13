import { Link } from "react-router-dom";
import { PageHeader } from "../components/ui/PageHeader";
import { Panel } from "../components/ui/Panel";
import { useAuth } from "../features/auth/AuthContext";

export function SettingsPage() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader
        title="Configuración"
        description="Identidad del estudio, preferencias y herramientas avanzadas."
      />
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel className="p-6">
          <h2 className="text-lg font-semibold">Estudio</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <Setting label="Nombre" value={user?.studio_name || user?.name} />
            <Setting
              label="País y moneda"
              value={[user?.country, user?.currency].filter(Boolean).join(" / ")}
            />
            <Setting label="Email" value={user?.email} />
            <Setting
              label="Reservas"
              value={user?.bookings_enabled ? "Activadas" : "Sin activar"}
            />
          </dl>
        </Panel>
        <Panel className="p-6">
          <h2 className="text-lg font-semibold">Avanzado</h2>
          <p className="mt-3 text-sm leading-6 text-stone-400">
            Estado de API, base de datos, almacenamiento, caché e integraciones locales.
          </p>
          <Link
            to="/app/settings/advanced"
            className="mt-5 inline-flex rounded-lg border border-white/10 bg-white/[0.055] px-4 py-2 text-sm font-semibold text-stone-100 hover:border-amber-200/20 hover:bg-white/[0.09]"
          >
            Abrir estado del sistema
          </Link>
        </Panel>
      </div>
    </>
  );
}

function Setting({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="mt-1 text-sm text-stone-200">{value || "Sin configurar"}</dd>
    </div>
  );
}
