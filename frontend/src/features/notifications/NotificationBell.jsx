import { useNotifications } from "./NotificationsContext";

export function NotificationBell({ onOpen }) {
  const { unread } = useNotifications();

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Notificaciones${unread > 0 ? `, ${unread} sin leer` : ""}`}
      className="relative rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-stone-300 transition hover:bg-white/[0.08] hover:text-stone-100"
    >
      Avisos
      {unread > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-amber-200 px-1 text-[11px] font-semibold tabular-nums text-stone-950">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </button>
  );
}
