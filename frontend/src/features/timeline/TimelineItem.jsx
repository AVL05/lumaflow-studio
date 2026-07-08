import { activityTypes, labelFor } from "../../utils/catalogs";

const toneByType = {
  created: "bg-sky-300",
  updated: "bg-stone-400",
  deleted: "bg-red-400",
  status_changed: "bg-amber-200",
  photo_uploaded: "bg-emerald-300",
  ai_analysis: "bg-fuchsia-300",
  ai_plan: "bg-fuchsia-300",
  delivered: "bg-emerald-300",
  checklist_completed: "bg-emerald-300",
  comment: "bg-stone-400",
};

function formatDate(iso) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TimelineItem({ activity, last }) {
  return (
    <li className="relative flex gap-4 pb-5 last:pb-0">
      {!last ? (
        <span aria-hidden className="absolute left-[5px] top-4 h-full w-px bg-white/10" />
      ) : null}
      <span
        aria-hidden
        className={`relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${toneByType[activity.type] ?? "bg-stone-500"}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <p className="text-sm text-stone-200">
            {activity.description || labelFor(activityTypes, activity.type)}
          </p>
          <span className="text-xs text-stone-600">{formatDate(activity.created_at)}</span>
        </div>
        <p className="mt-0.5 text-xs text-stone-600">
          {labelFor(activityTypes, activity.type)} · {activity.subject_type}
        </p>
      </div>
    </li>
  );
}
