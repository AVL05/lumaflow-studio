<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SessionRequest;
use App\Http\Resources\SessionResource;
use App\Models\Session;
use App\Services\ActivityLogger;
use App\Services\JobTransitionService;
use App\Services\NotificationService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SessionController extends Controller
{
    public function __construct(
        private readonly ActivityLogger $activity,
        private readonly NotificationService $notifications,
        private readonly JobTransitionService $jobs,
    ) {}

    public function index(): AnonymousResourceCollection
    {
        $sort = in_array(request('sort'), ['date', 'name', 'status', 'session_type', 'created_at'], true) ? request('sort') : 'date';
        $direction = request('direction') === 'asc' ? 'asc' : 'desc';

        $sessions = Session::query()
            ->ownedBy(request()->user()->id)
            ->search(request('search'))
            ->status(request('status'))
            ->type(request('type'))
            ->with('location')
            ->orderBy($sort, $direction)
            ->paginate(min((int) request('per_page', 12), 48));

        return SessionResource::collection($sessions);
    }

    public function store(SessionRequest $request): SessionResource
    {
        $session = request()->user()->sessions()->create($request->validated());
        $this->activity->log($request->user(), $session, ActivityLogger::CREATED, "Sesion creada: {$session->name}");

        return new SessionResource($session->load('location'));
    }

    public function show(Session $session): SessionResource
    {
        $this->ensureOwnership($session);

        return new SessionResource($session->load('location'));
    }

    public function update(SessionRequest $request, Session $session): SessionResource
    {
        $this->ensureOwnership($session);

        $previousStatus = $session->status;
        $session->update($request->validated());

        $targetJobStatus = match ($session->status) {
            'confirmed' => 'preparation', 'completed', 'editing' => 'editing', 'delivered' => 'delivered', default => null,
        };
        if ($targetJobStatus) {
            $this->jobs->advance($session->job, $targetJobStatus, "Sesión actualizada a {$session->status}");
        }

        if ($previousStatus === $session->status) {
            $this->activity->log($request->user(), $session, ActivityLogger::UPDATED, 'Sesion editada');
        } else {
            $this->activity->logStatusChange($request->user(), $session, $previousStatus, $session->status);
        }

        if ($previousStatus !== 'delivered' && $session->status === 'delivered') {
            $this->activity->log($request->user(), $session, ActivityLogger::DELIVERED, 'Sesion marcada como entregada');
            $this->notifications->success($request->user(), 'Sesion entregada', $session->name, '/app/sessions');
        }

        return new SessionResource($session->refresh()->load('location'));
    }

    public function destroy(Session $session): mixed
    {
        $this->ensureOwnership($session);
        $session->delete();

        return response()->noContent();
    }

    private function ensureOwnership(Session $session): void
    {
        abort_unless($session->user_id === request()->user()->id, 404);
    }
}
