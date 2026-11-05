<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ShotRequest;
use App\Http\Resources\ShotResource;
use App\Models\Job;
use App\Models\Shot;
use App\Services\ProductionService;
use App\Services\WorkspaceAuthorizer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ShotController extends Controller
{
    public function __construct(private readonly ProductionService $production) {}

    public function index(Request $request, Job $job): mixed
    {
        $this->authorizeJob($request, $job);
        $data = $request->validate(['page' => ['sometimes', 'integer', 'min:1', 'max:100000'], 'session_id' => ['nullable', 'integer', 'min:1'], 'status' => ['nullable', Rule::in(Shot::STATUSES)]]);

        return ShotResource::collection($job->shots()->with(['location', 'gearItems'])->when($data['session_id'] ?? null, fn ($q, $id) => $q->where('session_id', $id))->when($data['status'] ?? null, fn ($q, $status) => $q->where('status', $status))->paginate(24));
    }

    public function store(ShotRequest $request, Job $job): ShotResource
    {
        return new ShotResource($this->production->saveShot($request->user(), $job, null, $request->validated()));
    }

    public function update(ShotRequest $request, Job $job, Shot $shot): ShotResource
    {
        return new ShotResource($this->production->saveShot($request->user(), $job, $shot, $request->validated()));
    }

    public function duplicate(Request $request, Job $job, Shot $shot): ShotResource
    {
        $this->authorizeJob($request, $job, $shot);

        return new ShotResource($this->production->duplicate($request->user(), $job, $shot));
    }

    public function move(ShotRequest $request, Job $job, Shot $shot): mixed
    {
        $this->production->move($job, $shot, $request->validated('direction'));

        return response()->json(['message' => 'Orden actualizado.']);
    }

    public function destroy(Request $request, Job $job, Shot $shot): mixed
    {
        $this->authorizeJob($request, $job, $shot);
        $this->production->removeShot($job, $shot);

        return response()->noContent();
    }

    private function authorizeJob(Request $request, Job $job, ?Shot $shot = null): void
    {
        app(WorkspaceAuthorizer::class)->requireAccessOr404($request->user(), $job);
        abort_if($shot && $shot->job_id !== $job->id, 404);
    }
}
