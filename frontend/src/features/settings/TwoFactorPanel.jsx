import { useState } from "react";
import { getApiError } from "../../api/client";
import { twoFactorApi } from "../../api/twoFactor";
import { Button } from "../../components/ui/Button";
import { Field, inputClass } from "../../components/ui/Field";
import { Panel } from "../../components/ui/Panel";
import { useAuth } from "../auth/AuthContext";

export function TwoFactorPanel() {
  const { user, refreshUser } = useAuth();
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const enabled = Boolean(user?.two_factor_enabled);

  async function run(action) {
    setLoading(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(getApiError(err, "No se pudo completar la operación."));
    } finally {
      setLoading(false);
    }
  }

  const start = () => run(async () => setSetup(await twoFactorApi.setup()));

  const confirm = (event) => {
    event.preventDefault();
    return run(async () => {
      const data = await twoFactorApi.confirm(code);
      setRecoveryCodes(data.recovery_codes);
      setSetup(null);
      setCode("");
      await refreshUser();
    });
  };

  const disable = (event) => {
    event.preventDefault();
    return run(async () => {
      await twoFactorApi.disable({ password, code });
      setPassword("");
      setCode("");
      setRecoveryCodes(null);
      await refreshUser();
    });
  };

  return (
    <Panel className="mt-5 p-6">
      <h2 className="text-lg font-semibold">Verificación en dos pasos</h2>
      <p className="mt-3 text-sm leading-6 text-stone-400">
        Opcional. Añade un código de una aplicación de autenticación (Google Authenticator, Aegis,
        1Password…) además de tu contraseña al iniciar sesión.
      </p>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {recoveryCodes ? (
        <div className="mt-4 rounded-lg border border-amber-200/20 bg-amber-200/5 p-4">
          <p className="text-sm font-medium text-amber-100">
            Guarda estos códigos de recuperación. Solo se muestran ahora y cada uno sirve una vez.
          </p>
          <ul className="mt-3 grid gap-1 font-mono text-sm text-stone-100 sm:grid-cols-2">
            {recoveryCodes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Button className="mt-4" variant="secondary" onClick={() => setRecoveryCodes(null)}>
            Ya los he guardado
          </Button>
        </div>
      ) : null}

      {!enabled && !setup ? (
        <Button className="mt-4" variant="secondary" onClick={start} disabled={loading}>
          Activar verificación en dos pasos
        </Button>
      ) : null}

      {!enabled && setup ? (
        <form className="mt-4 space-y-4" onSubmit={confirm}>
          <p className="text-sm leading-6 text-stone-300">
            Añade esta clave en tu aplicación de autenticación (entrada manual) y escribe el código
            de 6 dígitos que genera.
          </p>
          <p className="break-all rounded-md bg-black/30 p-3 font-mono text-sm text-stone-100">
            {setup.secret}
          </p>
          <a
            className="text-sm text-amber-200 underline underline-offset-4"
            href={setup.otpauth_uri}
          >
            Abrir en la aplicación de autenticación
          </a>
          <Field label="Código de 6 dígitos">
            <input
              className={inputClass}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </Field>
          <Button disabled={loading || code.trim() === ""}>Confirmar y activar</Button>
        </form>
      ) : null}

      {enabled ? (
        <form className="mt-4 space-y-4" onSubmit={disable}>
          <p role="status" className="text-sm text-emerald-300">
            La verificación en dos pasos está activada.
          </p>
          <Field label="Contraseña">
            <input
              className={inputClass}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label="Código de verificación o de recuperación">
            <input
              className={inputClass}
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </Field>
          <Button variant="secondary" disabled={loading || password === "" || code.trim() === ""}>
            Desactivar
          </Button>
        </form>
      ) : null}
    </Panel>
  );
}
