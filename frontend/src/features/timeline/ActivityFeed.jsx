import { EmptyState } from "../../components/states/EmptyState";
import { TimelineItem } from "./TimelineItem";

export function ActivityFeed({ activities = [] }) {
  if (activities.length === 0) {
    return <EmptyState title="Sin actividad" description="Todavia no hay eventos registrados." />;
  }

  return (
    <ol>
      {activities.map((activity, index) => (
        <TimelineItem
          key={activity.id}
          activity={activity}
          last={index === activities.length - 1}
        />
      ))}
    </ol>
  );
}
