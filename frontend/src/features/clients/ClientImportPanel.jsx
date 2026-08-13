import { useState } from "react";
import { clientsApi } from "../../api/clients";
import { getApiError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { parseClientCsv } from "./clientCsv";

export function ClientImportPanel({ onImported }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function selectFile(event) {
    const file = event.target.files?.[0];
    setError("");
    setRows([]);
    setFileName(file?.name ?? "");
    if (!file) return;

    try {
      const parsed = parseClientCsv(await file.text());
      if (parsed.length > 250) throw new Error("El archivo supera el máximo de 250 clientes.");
      setRows(parsed);
    } catch (err) {
      setError(err.message || "No pudimos leer este CSV.");
    }
  }

  async function submit() {
    setSaving(true);
    setError("");
    try {
      const result = await clientsApi.import(rows);
      await onImported(result);
    } catch (err) {
      setError(getApiError(err, "No pudimos importar los clientes."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-5">
        <label className="block text-sm font-semibold text-stone-100" htmlFor="client-csv">
          Archivo CSV
        </label>
        <p className="mt-2 text-xs leading-5 text-stone-400">
          Primera fila: nombre, email, teléfono, empresa y notas. Solo nombre es obligatorio. Máximo
          250 contactos. Los emails ya existentes se omiten.
        </p>
        <input
          id="client-csv"
          type="file"
          accept=".csv,text/csv"
          onChange={selectFile}
          className="mt-4 block w-full text-sm text-stone-300 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-100 file:px-4 file:py-2 file:font-semibold file:text-stone-950 hover:file:bg-stone-50"
        />
      </div>

      {fileName && rows.length ? (
        <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] p-4">
          <p className="text-sm font-medium text-emerald-100">
            {rows.length} {rows.length === 1 ? "cliente listo" : "clientes listos"}
          </p>
          <p className="mt-1 text-xs text-stone-400">{fileName}</p>
          <div className="mt-3 space-y-1 text-xs text-stone-300">
            {rows.slice(0, 3).map((row, index) => (
              <p key={`${row.email}-${index}`}>
                {row.name} {row.email ? `· ${row.email}` : ""}
              </p>
            ))}
            {rows.length > 3 ? <p className="text-stone-500">y {rows.length - 3} más…</p> : null}
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="flex justify-end">
        <Button type="button" disabled={!rows.length || saving} onClick={submit}>
          {saving ? "Importando..." : `Importar ${rows.length || "clientes"}`}
        </Button>
      </div>
    </div>
  );
}
