<?php

namespace App\Services;

use App\Mail\DeliveryReadyMail;
use App\Models\Delivery;
use App\Models\Job;
use App\Models\PostproductionStage;
use App\Models\Task;
use App\Models\User;
use App\Support\AuditLog;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class DeliveryRevisionService
{
    public const CONTENT = ['gallery_url', 'gallery_provider', 'gallery_password', 'delivery_date'];

    public function __construct(private readonly ActivityLogger $activity, private readonly NotificationService $notifications) {}

    public function create(User $actor, array $data, ?Job $job = null): Delivery
    {
        return DB::transaction(function () use ($actor, $data, $job): Delivery {
            if ($job?->exists) {
                app(WorkspaceAuthorizer::class)->requireAccessOr404($actor, $job);
                app(ProductionService::class)->lockProject($job);
                $data['job_id'] = $job->id;
                $data['workspace_id'] = $job->workspace_id;
            }
            unset($data['version']);
            $delivery = $actor->deliveries()->create($data);
            $this->activity->log($actor, $delivery, ActivityLogger::CREATED, "Entrega creada: {$delivery->title}");
            if ($delivery->gallery_url && $delivery->status !== 'draft') {
                $delivery->revisions()->create([
                    ...Arr::only($delivery->getAttributes(), self::CONTENT), 'number' => 1,
                    'created_by' => $actor->id, 'author_name' => $actor->name,
                ]);
                $delivery->revision_number = 1;
                $delivery->save();
                if (in_array($delivery->status, ['pending', 'delivered', 'approved'], true)) {
                    $this->event($delivery, $actor, 'delivery_revision', 'Revisión 1 registrada', ['action' => 'sent']);
                    $this->syncStages($delivery, $delivery->status === 'approved' ? 'approved' : 'sent');
                }
            }

            return $delivery;
        }, 3);
    }

    public function lock(Delivery $delivery): Delivery
    {
        if ($delivery->job_id) {
            app(ProductionService::class)->lockProject((new Job)->forceFill(['id' => $delivery->job_id]));
        } elseif (DB::getDriverName() === 'sqlite') {
            DB::table('deliveries')->where('id', $delivery->id)->update(['id' => $delivery->id]);
        }

        return Delivery::query()->whereKey($delivery->id)->lockForUpdate()->firstOrFail();
    }

    public function snapshot(Delivery $delivery): void
    {
        if ($delivery->revision_number) {
            return;
        }
        $delivery->revisions()->create([
            ...Arr::only($delivery->getAttributes(), self::CONTENT), 'number' => 1, 'legacy' => true, 'published' => $delivery->status !== 'draft',
            'legacy_client_message' => $delivery->client_message, 'legacy_responded_at' => $delivery->client_responded_at,
        ]);
        $delivery->revision_number = 1;
        $delivery->save();
    }

    public function update(Delivery $delivery, User $actor, array $data): Delivery
    {
        $delivery = DB::transaction(function () use ($data, $actor, $delivery): Delivery {
            $delivery = $this->lock($delivery);
            $previousStatus = $delivery->status;
            if (isset($data['version'])) {
                abort_unless((int) $data['version'] === $delivery->version, 409, 'La entrega ha cambiado. Recarga antes de guardar.');
            }
            unset($data['version']);
            $candidate = clone $delivery;
            $candidate->fill($data);
            $published = $previousStatus !== 'draft' && $candidate->isDirty(self::CONTENT) && $delivery->gallery_url;
            if ($published) {
                abort_unless($candidate->gallery_url, 422, 'Conserva el enlace histórico. Publica otra revisión para sustituirlo.');
                validator(['gallery_url' => $candidate->gallery_url], ['gallery_url' => ['url:https', 'not_regex:~^https://[^/?#]*@~i', 'max:2048']])->validate();
                $delivery = $this->publish($delivery, $actor, [
                    ...Arr::only($candidate->getAttributes(), self::CONTENT),
                    'version' => $delivery->version, 'request_id' => (string) Str::uuid(),
                ], $previousStatus === 'approved' && $candidate->status === 'approved' ? 'delivered' : $candidate->status);
                $data = Arr::except($data, [...self::CONTENT, 'status']);
            }
            $delivery->fill($data);
            if ($delivery->isDirty()) {
                $delivery->version++;
                $delivery->save();
            }
            if ($delivery->gallery_url && in_array($delivery->status, ['pending', 'delivered', 'approved'], true)) {
                if (! $delivery->revision_number) {
                    $this->snapshot($delivery);
                } elseif (! $delivery->revisions()->where('number', $delivery->revision_number)->where('published', true)->exists()) {
                    $delivery->revisions()->create([
                        ...Arr::only($delivery->getAttributes(), self::CONTENT), 'number' => $delivery->revision_number + 1,
                        'created_by' => $actor->id, 'author_name' => $actor->name,
                    ]);
                    $delivery->revision_number++;
                    $delivery->save();
                }
            }
            $this->syncStages($delivery, $delivery->review_state ?? ($delivery->status === 'approved' ? 'approved' : 'sent'));
            $targetJobStatus = match ($delivery->status) {
                'pending' => 'review', 'delivered', 'approved' => 'delivered', 'archived' => 'closed', default => null,
            };
            if ($targetJobStatus) {
                app(JobTransitionService::class)->advance($delivery->job, $targetJobStatus, "Entrega actualizada a {$delivery->status}");
            }
            if ($previousStatus !== $delivery->status) {
                $this->event($delivery, $actor, ActivityLogger::STATUS_CHANGED, "Estado {$previousStatus} -> {$delivery->status}", ['action' => 'creator-status', 'from' => $previousStatus, 'to' => $delivery->status]);
            }
            if ($previousStatus !== $delivery->status && in_array($delivery->status, ['delivered', 'approved'], true)) {
                if ($delivery->session) {
                    $this->activity->log($actor, $delivery->session, ActivityLogger::DELIVERED, "Entrega {$delivery->status}: {$delivery->title}");
                }
                $this->notifications->success($actor, 'Entrega actualizada', $delivery->title, "/app/deliveries/{$delivery->id}");
            }
            if (! $published && $previousStatus !== 'delivered' && $delivery->status === 'delivered') {
                DB::afterCommit(fn () => $this->notifyClient($delivery->load('client')));
            }

            return $delivery;
        }, 3);

        return $delivery->refresh();
    }

    public function publish(Delivery $delivery, User $actor, array $data, string $status = 'delivered'): Delivery
    {
        return DB::transaction(function () use ($delivery, $actor, $data, $status): Delivery {
            $current = $this->lock($delivery);
            app(WorkspaceAuthorizer::class)->requireAccessOr404($actor, $current);
            $content = [...array_fill_keys(self::CONTENT, null), ...Arr::only($data, self::CONTENT), 'notes' => trim(strip_tags($data['notes'] ?? ''))];
            $hash = hash('sha256', json_encode($content, JSON_THROW_ON_ERROR));
            $existing = $current->revisions()->where('request_id', $data['request_id'])->first();
            if ($existing) {
                abort_unless(hash_equals($existing->payload_hash, $hash), 409, 'La solicitud ya se utilizó con otro contenido.');

                return $current;
            }
            $this->checkVersion($current, $data['version']);
            if ($current->status !== 'draft') {
                $this->snapshot($current);
            }
            $number = $current->revision_number + 1;
            $published = in_array($status, ['pending', 'delivered', 'approved'], true);
            $current->revisions()->create([
                ...$content, 'number' => $number, 'created_by' => $actor->id, 'author_name' => $actor->name,
                'request_id' => $data['request_id'], 'payload_hash' => $hash, 'published' => $published,
            ]);
            $current->forceFill([
                ...Arr::only($content, self::CONTENT), 'revision_number' => $number, 'version' => $current->version + 1,
                'status' => $status, 'review_state' => $published ? ($status === 'approved' ? 'approved' : 'sent') : null, 'client_message' => null, 'client_responded_at' => null,
            ])->save();
            $this->event($current, $actor, 'delivery_revision', $published ? "Revisión {$number} enviada" : "Revisión {$number} guardada sin publicar", ['action' => $published ? 'sent' : 'saved']);
            if ($published) {
                $this->notifications->success($current->user, 'Nueva revisión enviada', $current->title, "/app/deliveries/{$current->id}");
                $this->syncStages($current, $current->review_state);
                if ($status === 'delivered') {
                    DB::afterCommit(fn () => $this->notifyClient($current));
                }
            }

            return $current;
        }, 3);
    }

    public function respond(Delivery $delivery, string $action, array $data = [], ?User $actor = null): Delivery
    {
        return DB::transaction(function () use ($delivery, $action, $data, $actor): Delivery {
            $current = $this->lock($delivery);
            if ($actor) {
                app(WorkspaceAuthorizer::class)->requireAccessOr404($actor, $current);
            } else {
                // Revalidate the bearer token after acquiring the same lock used for revocation.
                $resolved = app(PublicDeliveryService::class)->resolve($delivery->public_token);
                abort_unless($resolved->id === $current->id, 404);
            }
            abort_unless(in_array($current->status, ['pending', 'delivered', 'approved'], true), 422, 'Publica la entrega antes de registrar respuestas.');
            $revision = max(1, $current->revision_number);
            abort_if(! isset($data['revision_number']) && $revision > 1, 422, 'Indica la revisión consultada.');
            abort_if(isset($data['revision_number']) && (int) $data['revision_number'] !== $revision, 409, 'Hay una nueva revisión. Recarga antes de responder.');
            $message = trim(strip_tags($data['message'] ?? ''));
            $requestId = $data['request_id'] ?? null;
            if ($requestId) {
                $existing = $current->activities()->where('properties->request_id', $requestId)->first();
                if ($existing) {
                    abort_unless(($existing->properties['action'] ?? null) === $action && ($existing->properties['message_hash'] ?? null) === hash('sha256', $message) && ($existing->properties['revision_number'] ?? null) === $revision, 409);

                    return $current;
                }
            }
            $state = $current->review_state ?? ($current->status === 'approved' ? 'approved' : 'sent');
            $target = match ($action) {
                'receive' => 'received', 'review' => 'in_review', 'request-changes' => 'changes_requested', 'approve' => 'approved', 'comment' => $state,
            };
            if (in_array($action, ['comment', 'request-changes'], true)) {
                abort_if($message === '', 422, 'El comentario no puede estar vacío.');
            }
            if ($action !== 'comment') {
                if (($state === $target && ($action !== 'request-changes' || $current->client_message === $message)) || ($action === 'receive' && $state !== 'sent') || ($action === 'review' && in_array($state, ['changes_requested', 'approved'], true))) {
                    return $current;
                }
                abort_if($state === 'approved', 422, 'La entrega ya está aprobada. Publica una nueva revisión.');
                if ($action === 'request-changes') {
                    abort_if($delivery->client_message !== $current->client_message && $current->client_message !== $message, 409, 'La entrega ha cambiado. Recarga antes de responder.');
                }
            }
            $this->snapshot($current);
            $from = $current->status;
            $current->review_state = $target;
            $current->client_responded_at = now();
            if ($action === 'approve') {
                $current->status = 'approved';
            }
            if ($action === 'request-changes') {
                $current->client_message = $message;
            }
            $current->version++;
            $current->save();
            $type = match ($action) {
                'approve' => ActivityLogger::STATUS_CHANGED,
                'comment', 'request-changes' => ActivityLogger::COMMENT,
                default => 'delivery_'.$action,
            };
            $this->event($current, $actor, $type, $message ?: match ($action) {
                'approve' => 'Entrega aprobada', 'receive' => 'Recepción confirmada', 'review' => 'Revisión iniciada',
            }, ['action' => $action, 'request_id' => $requestId, 'message_hash' => hash('sha256', $message), 'from' => $from, 'to' => $current->status, 'review_state' => $target]);
            $title = match ($action) {
                'approve' => 'Entrega aprobada por el cliente', 'request-changes' => 'El cliente ha pedido cambios',
                'receive' => 'Recepción de entrega confirmada', 'review' => 'Entrega en revisión', 'comment' => 'Nuevo comentario en la entrega',
            };
            $this->notifications->success($current->user, $title, $current->title, "/app/deliveries/{$current->id}");
            $this->syncStages($current, $target);
            AnalyticsCache::flushForWorkspace($current->workspace_id);

            return $current;
        }, 3);
    }

    public function portal(Delivery $delivery, User $actor, array $data): Delivery
    {
        return DB::transaction(function () use ($delivery, $actor, $data): Delivery {
            $current = $this->lock($delivery);
            app(WorkspaceAuthorizer::class)->requireAccessOr404($actor, $current);
            $this->checkVersion($current, $data['version']);
            if ($data['action'] === 'revoke') {
                if ($current->portal_revoked_at) {
                    return $current;
                }
                $current->portal_revoked_at = now();
            } elseif ($data['action'] === 'rotate') {
                $current->public_token = Str::random(40);
                $current->portal_revoked_at = null;
            } else {
                $current->gallery_expires_at = $data['expires_on'] ?? null;
            }
            if ($current->isDirty()) {
                $current->version++;
                $current->save();
                $this->event($current, $actor, 'delivery_portal', 'Configuración del portal actualizada', ['action' => $data['action']]);
            }

            return $current;
        }, 3);
    }

    public function event(Delivery $delivery, ?User $actor, string $type, string $description, array $properties = []): void
    {
        $this->activity->log($actor ?? $delivery->user, $delivery, $type, $description, [
            ...$properties, 'revision_number' => max(1, $delivery->revision_number),
            'actor' => $actor ? $actor->name : 'Portal del cliente', 'public' => $type !== 'delivery_portal' && in_array($delivery->status, ['pending', 'delivered', 'approved'], true),
        ]);
    }

    public function history(Delivery $delivery, bool $public = false): array
    {
        $revisions = $delivery->revisions()->when($public, fn ($q) => $q->where('published', true))->orderByDesc('number')->paginate(12, ['*'], 'revision_page');
        $events = $delivery->activities()->when($public, fn ($q) => $q->where('properties->public', true))
            ->orderByDesc('id')->paginate(24, ['*'], 'event_page');

        return [
            'revisions' => $revisions->through(fn ($r) => [
                'number' => $r->number, 'gallery_url' => $r->gallery_url && validator(['url' => $r->gallery_url], ['url' => ['url:http,https', 'not_regex:~^https?://[^/?#]*@~i']])->passes() ? $r->gallery_url : null, 'gallery_provider' => $r->gallery_provider,
                'gallery_password' => $r->gallery_password, 'delivery_date' => $r->delivery_date?->toDateString(),
                'notes' => $r->notes, 'legacy_client_message' => $r->legacy_client_message,
                'legacy_responded_at' => $r->legacy_responded_at?->toISOString(), 'legacy' => $r->legacy,
                'author' => $public ? 'Estudio' : $r->author_name, 'recorded_at' => $r->created_at?->toISOString(),
            ]),
            'events' => $events->through(fn ($e) => [
                'action' => $e->properties['action'] ?? $e->type, 'description' => $e->description,
                'revision_number' => $e->properties['revision_number'] ?? null,
                'actor' => $public && ($e->properties['actor'] ?? null) !== 'Portal del cliente' ? 'Estudio' : ($e->properties['actor'] ?? 'Estudio'),
                'at' => $e->created_at?->toISOString(),
            ]),
        ];
    }

    public function syncStages(Delivery $delivery, string $state): void
    {
        if (! $delivery->job_id || ! in_array($delivery->status, ['pending', 'delivered', 'approved'], true)) {
            return;
        }
        foreach (PostproductionStage::query()->where('job_id', $delivery->job_id)->whereIn('key', ['client_review', 'corrections', 'delivered'])->orderBy('position')->orderBy('id')->get() as $stage) {
            if ($stage->status === 'skipped') {
                continue;
            }
            $status = $stage->status;
            if ($state === 'approved' && in_array($stage->key, ['client_review', 'delivered'], true)) {
                $allApproved = ! Delivery::query()->where('job_id', $delivery->job_id)->whereNotIn('status', ['approved', 'archived', 'draft'])->exists();
                $open = $stage->tasks()->whereIn('status', Task::OPEN_STATUSES)->exists()
                    || $stage->checklists()->whereHas('items', fn ($q) => $q->where('is_completed', false))->exists();
                $pendingEarlier = $stage->key === 'delivered' && PostproductionStage::query()->where('job_id', $delivery->job_id)->where('id', '!=', $stage->id)->whereNotIn('status', ['completed', 'skipped'])->exists();
                $status = $allApproved && ! $open && ! $pendingEarlier ? 'completed' : 'in_progress';
            } elseif (($stage->key === 'client_review' && in_array($state, ['sent', 'received', 'in_review'], true)) || ($stage->key === 'corrections' && $state === 'changes_requested')) {
                $status = 'in_progress';
            } elseif ($stage->key === 'delivered' && $state !== 'approved' && $status === 'completed') {
                $status = 'in_progress';
            }
            if ($status !== $stage->status) {
                $stage->update(['status' => $status, 'revision' => $stage->revision + 1]);
            }
        }
    }

    private function checkVersion(Delivery $delivery, int $version): void
    {
        abort_unless($delivery->version === $version, 409, 'La entrega ha cambiado. Conserva tus notas y recarga.');
    }

    public function notifyClient(Delivery $delivery): void
    {
        if (! $delivery->client?->email) {
            return;
        }
        try {
            $url = rtrim(config('app.frontend_url'), '/')."/deliver/{$delivery->public_token}";
            Mail::to($delivery->client->email)->send(new DeliveryReadyMail($delivery, $url));
        } catch (\Throwable $exception) {
            AuditLog::mailFailed(DeliveryReadyMail::class, $exception::class, $delivery->user_id);
        }
    }
}
