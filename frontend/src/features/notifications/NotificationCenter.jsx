import { useEffect } from "react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/states/EmptyState";
import { NotificationItem } from "./NotificationItem";
import { useNotifications } from "./NotificationsContext";

export function NotificationCenter({ open, onClose }) {
  const { items, loading, unread, refreshList, markRead, markAllRead, remove, clearRead } =
    useNotifications();

  useEffect(() => {
    if (open) refreshList();
  }, [open, refreshList]);

  return (
    <Modal open={open} title="Notificaciones" onClose={onClose}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-stone-500">
          {unread} sin leer de {items.length}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={markAllRead} disabled={unread === 0}>
            Marcar todas
          </Button>
          <Button variant="ghost" onClick={clearRead}>
            Limpiar leidas
          </Button>
        </div>
      </div>

      <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
        {loading ? (
          <>
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </>
        ) : items.length === 0 ? (
          <EmptyState
            title="Todo al dia"
            description="Aqui apareceran avisos de entregas, tareas y eventos del sistema."
          />
        ) : (
          items.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={markRead}
              onRemove={remove}
              onNavigate={onClose}
            />
          ))
        )}
      </div>
    </Modal>
  );
}
