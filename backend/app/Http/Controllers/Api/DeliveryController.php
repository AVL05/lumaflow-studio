<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DeliveryRequest;
use App\Http\Resources\DeliveryResource;
use App\Mail\DeliveryReadyMail;
use App\Models\Delivery;
use App\Services\ActivityLogger;
use App\Services\JobTransitionService;
use App\Services\NotificationService;
use App\Support\AuditLog;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Mail;
use Throwable;

class DeliveryController extends Controller
{
    public function __construct(
        private readonly ActivityLogger $activity,
        private readonly NotificationService $notifications,
        private readonly JobTransitionService $jobs,
    ) {}

    public function index(): AnonymousResourceCollection
    {
        $sort = in_array(request('sort'), ['title', 'status', 'delivery_date', 'created_at'], true) ? request('sort') : 'created_at';
        $direction = request('direction') === 'asc' ? 'asc' : 'desc';

        $deliveries = Delivery::query()
            ->ownedBy(request()->user()->id)
            ->with(['client', 'session'])
            ->search(request('search'))
            ->status(request('status'))
            ->when(request('client_id'), fn ($query) => $query->where('client_id', request('client_id')))
            ->orderBy($sort, $direction)
            ->paginate(min((int) request('per_page', 12), 48));

        return DeliveryResource::collection($deliveries);
    }

    public function store(DeliveryRequest $request): DeliveryResource
    {
        $delivery = request()->user()->deliveries()->create($request->validated());
        $this->activity->log($request->user(), $delivery, ActivityLogger::CREATED, "Entrega creada: {$delivery->title}");

        return new DeliveryResource($delivery->load(['client', 'session', 'images']));
    }

    public function show(Delivery $delivery): DeliveryResource
    {
        $this->ensureOwnership($delivery);

        return new DeliveryResource($delivery->load(['client', 'session']));
    }

    public function update(DeliveryRequest $request, Delivery $delivery): DeliveryResource
    {
        $this->ensureOwnership($delivery);

        $previousStatus = $delivery->status;
        $delivery->update($request->validated());
        $targetJobStatus = match ($delivery->status) {
            'pending' => 'review', 'delivered', 'approved' => 'delivered', 'archived' => 'closed', default => null,
        };
        if ($targetJobStatus) {
            $this->jobs->advance($delivery->job, $targetJobStatus, "Entrega actualizada a {$delivery->status}");
        }
        $this->activity->logStatusChange($request->user(), $delivery, $previousStatus, $delivery->status);

        if ($previousStatus !== $delivery->status && in_array($delivery->status, ['delivered', 'approved'], true)) {
            if ($delivery->session) {
                $this->activity->log($request->user(), $delivery->session, ActivityLogger::DELIVERED, "Entrega {$delivery->status}: {$delivery->title}");
            }

            $this->notifications->success($request->user(), 'Entrega actualizada', $delivery->title, "/app/deliveries/{$delivery->id}");
        }

        if ($previousStatus !== 'delivered' && $delivery->status === 'delivered') {
            $this->notifyClient($delivery->load('client'));
        }

        return new DeliveryResource($delivery->refresh()->load(['client', 'session']));
    }

    public function destroy(Delivery $delivery): mixed
    {
        $this->ensureOwnership($delivery);
        $delivery->delete();

        return response()->noContent();
    }

    /**
     * El correo al cliente no debe romper la actualizacion si el SMTP falla
     * o el cliente no tiene email registrado.
     */
    private function notifyClient(Delivery $delivery): void
    {
        if (! $delivery->client?->email) {
            return;
        }

        $portalUrl = rtrim(config('app.frontend_url'), '/')."/deliver/{$delivery->public_token}";

        try {
            Mail::to($delivery->client->email)->send(new DeliveryReadyMail($delivery, $portalUrl));
        } catch (Throwable $exception) {
            AuditLog::mailFailed(DeliveryReadyMail::class, $exception->getMessage(), $delivery->user_id);
        }
    }

    private function ensureOwnership(Delivery $delivery): void
    {
        abort_unless($delivery->user_id === request()->user()->id, 404);
    }
}
