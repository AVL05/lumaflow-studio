<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Models\Activity;
use App\Models\Session;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ActivityController extends Controller
{
    /** Feed global de actividad del usuario. */
    public function index(): AnonymousResourceCollection
    {
        $activities = Activity::query()
            ->ownedBy(request()->user()->id)
            ->type(request('type'))
            ->latest()
            ->paginate(min((int) request('per_page', 20), 60));

        return ActivityResource::collection($activities);
    }

    /** Timeline cronologico de una sesion concreta. */
    public function session(Session $session): AnonymousResourceCollection
    {
        abort_unless($session->user_id === request()->user()->id, 404);

        $activities = Activity::query()
            ->ownedBy(request()->user()->id)
            ->forSubject($session->getMorphClass(), $session->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(100)
            ->get();

        return ActivityResource::collection($activities);
    }
}
