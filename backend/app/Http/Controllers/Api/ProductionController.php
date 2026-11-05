<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductionDayRequest;
use App\Http\Resources\SessionResource;
use App\Models\Job;
use App\Models\Session;
use App\Services\ProductionDocumentService;
use App\Services\ProductionService;
use App\Services\WorkspaceAuthorizer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductionController extends Controller
{
    public function pdf(Request $request, Job $job, ProductionDocumentService $documents): mixed
    {
        app(WorkspaceAuthorizer::class)->requireAccessOr404($request->user(), $job);
        $data = $request->validate(['session_id' => ['nullable', 'integer', Rule::exists('sessions', 'id')->where('job_id', $job->id)->where('workspace_id', $job->workspace_id)]]);

        return $documents->pdf($job, isset($data['session_id']) ? (int) $data['session_id'] : null);
    }

    public function index(Request $request, Job $job): mixed
    {
        app(WorkspaceAuthorizer::class)->requireAccessOr404($request->user(), $job);
        $data = $request->validate(['page' => ['sometimes', 'integer', 'min:1', 'max:100000'], 'session_id' => ['nullable', 'integer', 'min:1']]);

        return SessionResource::collection($job->sessions()->with(['location', 'checklists.items'])->when($data['session_id'] ?? null, fn ($q, $id) => $q->whereKey($id))->orderBy('date')->orderBy('time')->orderBy('id')->paginate(24));
    }

    public function store(ProductionDayRequest $request, Job $job, ProductionService $service): SessionResource
    {
        return new SessionResource($service->createDay($request->user(), $job, $request->validated()));
    }

    public function update(ProductionDayRequest $request, Job $job, Session $session, SessionController $sessions): SessionResource
    {
        return $sessions->update($request, $session);
    }
}
