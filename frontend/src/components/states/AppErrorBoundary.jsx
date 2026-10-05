import { Component } from "react";
import { captureAppError } from "../../app/sentry";

/**
 * Frontera global de errores React (Issue #11).
 *
 * Muestra una caida controlada con referencia del evento y reporta a
 * observabilidad solo si esta configurada. Nunca bloquea por el SDK.
 */
export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false, reference: null };
  }

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error) {
    try {
      const reference = captureAppError(error);
      if (reference) this.setState({ reference });
    } catch {
      // Observabilidad nunca bloquea la app.
    }
  }

  render() {
    if (!this.state.crashed) return this.props.children;

    return (
      <div className="grid min-h-dvh place-items-center bg-[#090908] px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
            LumaFlow Studio
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-stone-50">Algo se ha roto</h1>
          <p className="mt-3 text-sm leading-6 text-stone-400">
            Vuelve a intentarlo. Si el problema continúa, comparte esta referencia con soporte.
          </p>
          {this.state.reference ? (
            <p className="mt-4 font-mono text-xs text-stone-500">
              Referencia del error: {this.state.reference}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-amber-200 px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-amber-100"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }
}
