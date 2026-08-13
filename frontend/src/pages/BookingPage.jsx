import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { publicApi } from "../api/public";
import { getApiError } from "../api/client";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Field, inputClass } from "../components/ui/Field";
import { Textarea } from "../components/ui/Textarea";
import { ErrorState } from "../components/states/ErrorState";
import { BrandLogo } from "../components/branding/BrandLogo";

const defaults = {
  name: "",
  email: "",
  phone: "",
  session_type: "",
  preferred_date: "",
  message: "",
};

export function BookingPage() {
  const { slug } = useParams();
  const [studio, setStudio] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState(defaults);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    publicApi
      .studio(slug)
      .then(setStudio)
      .catch(() => setNotFound(true));
  }, [slug]);

  function setValue(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await publicApi.book(slug, {
        ...form,
        preferred_date: form.preferred_date || null,
      });
      setSent(true);
    } catch (err) {
      setError(getApiError(err, "No se pudo enviar la solicitud."));
    } finally {
      setSaving(false);
    }
  }

  if (notFound) {
    return (
      <PublicShell>
        <ErrorState message="Este enlace de reserva no existe o ya no esta disponible." />
      </PublicShell>
    );
  }

  return (
    <PublicShell studioName={studio?.name}>
      {sent ? (
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-semibold text-stone-50">Solicitud enviada</h1>
          <p className="mt-3 text-sm leading-6 text-stone-400">
            {studio?.name ?? "El estudio"} ha recibido tu peticion y te respondera pronto.
          </p>
        </Card>
      ) : (
        <Card className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
            Reserva tu sesion
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-50">
            {studio ? studio.name : "Cargando..."}
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-400">
            Cuentanos que necesitas y te contactaremos para confirmar fecha y detalles.
          </p>

          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={submit}>
            {error ? (
              <div className="md:col-span-2">
                <ErrorState message={error} />
              </div>
            ) : null}
            <Field label="Nombre">
              <input
                required
                className={inputClass}
                value={form.name}
                onChange={(e) => setValue("name", e.target.value)}
              />
            </Field>
            <Field label="Email">
              <input
                required
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => setValue("email", e.target.value)}
              />
            </Field>
            <Field label="Telefono">
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => setValue("phone", e.target.value)}
              />
            </Field>
            <Field label="Tipo de sesion">
              <input
                className={inputClass}
                placeholder="Boda, retrato, producto..."
                value={form.session_type}
                onChange={(e) => setValue("session_type", e.target.value)}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Fecha preferida">
                <input
                  type="date"
                  className={inputClass}
                  value={form.preferred_date}
                  onChange={(e) => setValue("preferred_date", e.target.value)}
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Cuentanos mas">
                <Textarea
                  rows="4"
                  value={form.message}
                  onChange={(e) => setValue("message", e.target.value)}
                  placeholder="Numero de invitados, localizacion, estilo que buscas..."
                />
              </Field>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button disabled={saving}>{saving ? "Enviando..." : "Enviar solicitud"}</Button>
            </div>
          </form>
        </Card>
      )}
    </PublicShell>
  );
}

function PublicShell({ children, studioName }) {
  return (
    <main className="min-h-dvh bg-[#090908] text-stone-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(196,141,72,0.14),transparent_30rem),linear-gradient(145deg,#090908_0%,#12100d_48%,#080807_100%)]" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-4 py-10">
        <Link to="/" className="mx-auto mb-8 flex items-center gap-3">
          <BrandLogo className="h-9 w-9 rounded-md" />
          <span className="text-sm font-semibold tracking-tight text-stone-50">
            {studioName ? `${studioName} · LumaFlow Studio` : "LumaFlow Studio"}
          </span>
        </Link>
        {children}
      </div>
    </main>
  );
}
