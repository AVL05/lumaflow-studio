<?php

namespace App\Services;

use App\Models\Job;
use App\Models\Session;
use App\Models\Shot;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class ProductionService
{
    public function __construct(private readonly ActivityLogger $activity, private readonly WorkspaceAuthorizer $authorizer) {}

    public function lockProject(Job $job): void
    {
        // SQLite ignores FOR UPDATE; acquire its write lock before reading positions.
        if (DB::getDriverName() === 'sqlite') {
            DB::table('photography_jobs')->where('id', $job->id)->update(['id' => $job->id]);
        }
        Job::query()->whereKey($job->id)->lockForUpdate()->firstOrFail();
    }

    public function createDay(User $actor, Job $job, array $data): Session
    {
        $this->authorizer->requireAccessOr404($actor, $job);

        return DB::transaction(function () use ($actor, $job, $data): Session {
            $this->lockProject($job);
            $session = $job->sessions()->create($data + ['user_id' => $actor->id, 'workspace_id' => $job->workspace_id]);
            foreach (['Preparación' => ['Revisar briefing y tomas', 'Comprobar equipo y baterías'], 'Recogida' => ['Comprobar inventario', 'Recoger equipo y revisar localización']] as $name => $items) {
                app(ChecklistService::class)->createWithTemplate($actor->id, ['session_id' => $session->id, 'name' => $name, 'type' => 'custom', 'items' => $items]);
            }
            $this->activity->log($actor, $job, 'production_updated', 'Jornada de producción actualizada.', ['session_id' => $session->id]);

            return $session->load(['location', 'checklists.items']);
        }, 3);
    }

    public function saveShot(User $actor, Job $job, ?Shot $shot, array $data): Shot
    {
        $this->authorizer->requireAccessOr404($actor, $job);

        return DB::transaction(function () use ($actor, $job, $shot, $data): Shot {
            $this->lockProject($job);
            if ($sessionId = $data['session_id'] ?? null) {
                Session::query()->whereKey($sessionId)->where('job_id', $job->id)->lockForUpdate()->firstOrFail();
            }
            $attributes = Arr::except($data, ['gear_item_ids', 'revision']);
            if ($shot) {
                $shot = $job->shots()->whereKey($shot->id)->firstOrFail();
                abort_unless($shot->revision === (int) $data['revision'], 409, 'La toma ha cambiado. Conserva tus notas y recarga la lista.');
                $shot->fill($attributes);
                $changed = $shot->isDirty() || (isset($data['gear_item_ids']) && $shot->gearItems()->pluck('gear_items.id')->sort()->values()->all() !== collect($data['gear_item_ids'])->sort()->values()->all());
                if ($changed) {
                    $shot->revision++;
                    $shot->save();
                }
            } else {
                $changed = true;
                $shot = $job->shots()->create($attributes + ['user_id' => $actor->id, 'workspace_id' => $job->workspace_id, 'position' => (int) $job->shots()->max('position') + 1]);
            }
            if (array_key_exists('gear_item_ids', $data)) {
                $shot->gearItems()->sync($data['gear_item_ids']);
            }
            if ($changed) {
                $this->activity->log($actor, $job, 'shot_updated', 'Lista de tomas actualizada.', ['shot_id' => $shot->id]);
            }

            return $shot->refresh()->load(['location', 'gearItems']);
        }, 3);
    }

    public function duplicate(User $actor, Job $job, Shot $shot): Shot
    {
        $data = $shot->only(['session_id', 'location_id', 'scene', 'description', 'shot_type', 'camera_movement', 'focal_length', 'estimated_seconds']);
        $data['gear_item_ids'] = $shot->gearItems()->pluck('gear_items.id')->all();

        return $this->saveShot($actor, $job, null, $data + ['status' => 'pending']);
    }

    public function move(Job $job, Shot $shot, string $direction): void
    {
        DB::transaction(function () use ($job, $shot, $direction): void {
            $this->lockProject($job);
            $shot = $job->shots()->whereKey($shot->id)->firstOrFail();
            $previous = $direction === 'up';
            $neighbor = $job->shots()->reorder()->where('position', $previous ? '<' : '>', $shot->position)->orderBy('position', $previous ? 'desc' : 'asc')->first();
            if ($neighbor) {
                $position = $shot->position;
                $shot->update(['position' => $neighbor->position]);
                $neighbor->update(['position' => $position]);
            }
        }, 3);
    }

    public function removeShot(Job $job, Shot $shot): void
    {
        DB::transaction(function () use ($job, $shot): void {
            $this->lockProject($job);
            $job->shots()->whereKey($shot->id)->firstOrFail()->delete();
        }, 3);
    }
}
