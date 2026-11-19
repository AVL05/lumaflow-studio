import { useState } from "react";
import { downloadAccountExport } from "../../api/account";
import { getApiError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";

export function DataExportPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function exportData() {
    setLoading(true);
    setError("");
    setDone(false);

    try {
      await downloadAccountExport();
      setDone(true);
    } catch (err) {
      setError(getApiError(err, "No se pudo generar la exportación."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel className="mt-5 p-6">
      <h2 className="text-lg font-semibold">Tus datos</h2>
      <p className="mt-3 text-sm leading-6 text-stone-400">
        Descarga un archivo JSON con todos los datos de tu estudio: clientes, trabajos, sesiones,
        presupuestos, facturas, contratos, entregas y más. No incluye contraseñas ni enlaces
        privados de los portales.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={exportData} disabled={loading}>
          {loading ? "Preparando…" : "Exportar mis datos"}
        </Button>
        {done ? (
          <span role="status" className="text-sm text-emerald-300">
            Exportación descargada.
          </span>
        ) : null}
        {error ? (
          <span role="alert" className="text-sm text-red-300">
            {error}
          </span>
        ) : null}
      </div>
    </Panel>
  );
}
