<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Models\Activity;
use App\Models\Session;
use App\Services\WorkspaceAuthorizer;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ActivityController extends Controller
{
    /** Feed global de actividad del usuario. */
    public function index(): AnonymousResourceCollection
    {
        $activities = Activity::query()
            ->accessibleBy(request()->user())
            ->type(request('type'))
            ->latest()
            ->paginate(min((int) request('per_page', 20), 60));

        return ActivityResource::collection($activities);
    }

    /** Timeline cronologico de una sesion concreta. */
    public function session(Session $session): AnonymousResourceCollection
    {
        app(WorkspaceAuthorizer::class)->requireAccessOr404(request()->user(), $session);

        $activities = Activity::query()
            ->accessibleBy(request()->user())
            ->forSubject($session->getMorphClass(), $session->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(100)
            ->get();

        return ActivityResource::collection($activities);
    }
}
