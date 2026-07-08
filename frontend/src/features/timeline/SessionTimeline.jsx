import { useCallback } from "react";
import { activitiesApi } from "../../api/activities";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/states/EmptyState";
import { ErrorState } from "../../components/states/ErrorState";
import { useResource } from "../../hooks/useResource";
import { TimelineItem } from "./TimelineItem";

export function SessionTimeline({ sessionId }) {
  const fetcher = useCallback(() => activitiesApi.sessionTimeline(sessionId), [sessionId]);
  const { data, loading, error } = useResource(fetcher);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6" />
        <Skeleton className="h-6" />
        <Skeleton className="h-6" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} />;

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Sin actividad"
        description="Las acciones sobre esta sesion apareceran aqui automaticamente."
      />
    );
  }

  return (
    <ol className="mt-2">
      {data.map((activity, index) => (
        <TimelineItem
          key={activity.id}
          activity={activity}
          last={index === data.length - 1}
        />
      ))}
    </ol>
  );
}
