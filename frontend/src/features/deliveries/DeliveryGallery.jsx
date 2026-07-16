import { useRef, useState } from "react";
import { deliveriesApi } from "../../api/deliveries";
import { getApiError } from "../../api/client";
import { ErrorState } from "../../components/states/ErrorState";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

export function DeliveryGallery({ delivery, onChange }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(event) {
    const images = [...event.target.files];
    if (!images.length) return;
    setBusy(true);
    setError("");
    try {
      await deliveriesApi.uploadImages(delivery.id, images);
      await onChange();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function remove(image) {
    if (!window.confirm(`¿Eliminar ${image.filename}?`)) return;
    setBusy(true);
    setError("");
    try {
      await deliveriesApi.removeImage(delivery.id, image.id);
      await onChange();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mt-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
            Galería privada
          </p>
          <h2 className="mt-2 text-xl font-semibold">Selección del cliente</h2>
          <p className="mt-1 text-sm text-stone-400">
            JPEG, PNG o WebP · hasta 15 MB por imagen · máximo 50 por carga.
          </p>
        </div>
        <>
          <input
            ref={input}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={upload}
          />
          <Button disabled={busy} onClick={() => input.current?.click()}>
            {busy ? "Procesando..." : "Subir fotografías"}
          </Button>
        </>
      </div>
      {error ? (
        <div className="mt-4">
          <ErrorState message={error} />
        </div>
      ) : null}
      {delivery.images?.length ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {delivery.images.map((image) => (
            <figure
              key={image.id}
              className="group overflow-hidden rounded-xl border border-white/10 bg-black/25"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={image.url}
                  alt={image.filename}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
              <figcaption className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <p className="truncate text-xs text-stone-300">{image.filename}</p>
                  {image.client_favorite ? (
                    <p className="mt-1 text-xs text-amber-200">Favorita del cliente</p>
                  ) : null}
                </div>
                <Button variant="danger" disabled={busy} onClick={() => remove(image)}>
                  Eliminar
                </Button>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-stone-400">
          Todavía no hay fotografías. El portal del cliente las mostrará en cuanto las subas.
        </p>
      )}
    </Card>
  );
}
