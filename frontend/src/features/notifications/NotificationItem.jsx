import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { labelFor, notificationTypes, toneFor } from "../../utils/catalogs";

function formatDate(iso) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationItem({ notification, onRead, onRemove, onNavigate }) {
  return (
    <article
      className={`rounded-md border px-3 py-3 transition ${
        notification.is_read
          ? "border-white/[0.06] bg-transparent"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-stone-100">{notification.title}</p>
          {notification.message ? (
            <p className="mt-1 line-clamp-2 text-xs text-stone-400">{notification.message}</p>
          ) : null}
        </div>
        <Badge variant={toneFor(notificationTypes, notification.type)}>
          {labelFor(notificationTypes, notification.type)}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-stone-400">
        <span>{formatDate(notification.created_at)}</span>
        {notification.link ? (
          <Link
            to={notification.link}
            onClick={onNavigate}
            className="text-amber-200 transition hover:text-amber-100"
          >
            Abrir
          </Link>
        ) : null}
        {!notification.is_read ? (
          <button
            type="button"
            onClick={() => onRead(notification.id)}
            className="transition hover:text-stone-200"
          >
            Marcar leida
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onRemove(notification.id)}
          className="transition hover:text-red-300"
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}
