import { useNotifications } from "./NotificationsContext";

export function NotificationBell({ onOpen }) {
  const { unread } = useNotifications();

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Notificaciones${unread > 0 ? `, ${unread} sin leer` : ""}`}
      className="relative flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-stone-300 transition hover:bg-white/[0.08] hover:text-stone-100"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0">
        <path
          d="M18 16v-5a6 6 0 1 0-12 0v5l-1.6 2.4a1 1 0 0 0 .84 1.6h13.52a1 1 0 0 0 .84-1.6L18 16Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 20a2.5 2.5 0 0 0 5 0"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Avisos
      {unread > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-amber-200 px-1 text-xs font-semibold tabular-nums text-stone-950">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </button>
  );
}
