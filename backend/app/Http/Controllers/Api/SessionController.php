<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SessionRequest;
use App\Http\Resources\SessionResource;
use App\Models\Session;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SessionController extends Controller
{
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
            ->withCount('photos')
            ->orderBy($sort, $direction)
            ->paginate(min((int) request('per_page', 12), 48));

        return SessionResource::collection($sessions);
    }

    public function store(SessionRequest $request): SessionResource
    {
        $session = request()->user()->sessions()->create($request->validated());

        return new SessionResource($session->load('location'));
    }

    public function show(Session $session): SessionResource
    {
        $this->ensureOwnership($session);

        return new SessionResource($session->load('location')->loadCount('photos'));
    }

    public function update(SessionRequest $request, Session $session): SessionResource
    {
        $this->ensureOwnership($session);
        $session->update($request->validated());

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
