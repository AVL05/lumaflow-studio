<?php

namespace App\Services;

use App\Models\Album;
use App\Models\Client;
use App\Models\Delivery;
use App\Models\GearItem;
use App\Models\Location;
use App\Models\Photo;
use App\Models\Preset;
use App\Models\Session;
use App\Models\Tag;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BulkActionService
{
    public const ACTIONS = ['delete', 'status', 'tags', 'album', 'client'];

    /** Acciones permitidas por recurso. La validacion se apoya en este mapa. */
    public const MATRIX = [
        'sessions' => ['delete', 'status'],
        'photos' => ['delete', 'tags', 'album'],
        'tasks' => ['delete', 'status', 'client'],
        'deliveries' => ['delete', 'status', 'client'],
        'clients' => ['delete', 'status'],
        'gear' => ['delete'],
        'presets' => ['delete'],
        'locations' => ['delete'],
    ];

    private const STATUSES = [
        'sessions' => ['planned', 'confirmed', 'completed', 'editing', 'delivered', 'cancelled'],
        'tasks' => Task::STATUSES,
        'deliveries' => ['draft', 'pending', 'delivered', 'approved', 'archived'],
        'clients' => ['active', 'inactive', 'lead', 'archived'],
    ];

    public function __construct(private readonly ActivityLogger $activity) {}

    public function supports(string $resource, string $action): bool
    {
        return in_array($action, self::MATRIX[$resource] ?? [], true);
    }

    public function statusesFor(string $resource): array
    {
        return self::STATUSES[$resource] ?? [];
    }

    /**
     * Ejecuta la accion sobre los ids del usuario. Devuelve el numero de
     * registros afectados. Todo dentro de una transaccion.
     */
    public function run(User $user, string $resource, string $action, array $ids, array $payload = []): int
    {
        abort_unless($this->supports($resource, $action), 422, 'Accion no soportada para este recurso.');

        return DB::transaction(fn (): int => match ($action) {
            'delete' => $this->delete($user, $resource, $ids),
            'status' => $this->status($user, $resource, $ids, $payload['value'] ?? ''),
            'tags' => $this->tags($user, $ids, $payload['tag_ids'] ?? []),
            'album' => $this->album($user, $ids, (int) ($payload['album_id'] ?? 0)),
            'client' => $this->client($user, $resource, $ids, (int) ($payload['client_id'] ?? 0)),
        });
    }

    private function delete(User $user, string $resource, array $ids): int
    {
        $models = $this->scoped($resource, $user)->whereIn('id', $ids)->get();

        if ($resource === 'photos') {
            Storage::disk('public')->delete(
                $models->flatMap(fn (Photo $photo) => array_filter([$photo->file_path, $photo->thumbnail_path]))->all()
            );
        }

        // Borrado modelo a modelo: un delete masivo por query saltaria los eventos
        // que limpian actividades y recordatorios morficos.
        $models->each->delete();

        return $models->count();
    }

    private function status(User $user, string $resource, array $ids, string $value): int
    {
        abort_unless(in_array($value, $this->statusesFor($resource), true), 422, 'Estado no valido.');

        $models = $this->scoped($resource, $user)->whereIn('id', $ids)->get();

        foreach ($models as $model) {
            $previous = $model->status;
            $model->update(['status' => $value]);
            $this->activity->logStatusChange($user, $model, $previous, $value);
        }

        return $models->count();
    }

    private function tags(User $user, array $ids, array $tagIds): int
    {
        $tagIds = Tag::query()->ownedBy($user->id)->whereIn('id', $tagIds)->pluck('id')->all();
        $photos = Photo::query()->ownedBy($user->id)->whereIn('id', $ids)->get();

        foreach ($photos as $photo) {
            $photo->tags()->syncWithoutDetaching($tagIds);
        }

        return $photos->count();
    }

    private function album(User $user, array $ids, int $albumId): int
    {
        $album = Album::query()->ownedBy($user->id)->findOrFail($albumId);
        $photoIds = Photo::query()->ownedBy($user->id)->whereIn('id', $ids)->pluck('id')->all();
        $album->photos()->syncWithoutDetaching($photoIds);

        return count($photoIds);
    }

    private function client(User $user, string $resource, array $ids, int $clientId): int
    {
        Client::query()->ownedBy($user->id)->findOrFail($clientId);

        return $this->scoped($resource, $user)->whereIn('id', $ids)->update(['client_id' => $clientId]);
    }

    private function scoped(string $resource, User $user): Builder
    {
        return match ($resource) {
            'sessions' => Session::query()->ownedBy($user->id),
            'photos' => Photo::query()->ownedBy($user->id),
            'tasks' => Task::query()->ownedBy($user->id),
            'deliveries' => Delivery::query()->ownedBy($user->id),
            'clients' => Client::query()->ownedBy($user->id),
            'gear' => GearItem::query()->ownedBy($user->id),
            'presets' => Preset::query()->ownedBy($user->id),
            'locations' => Location::query()->ownedBy($user->id),
        };
    }
}
