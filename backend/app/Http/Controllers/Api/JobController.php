<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\JobRequest;
use App\Http\Requests\ProjectBriefingRequest;
use App\Http\Resources\JobResource;
use App\Models\Client;
use App\Models\GearItem;
use App\Models\Job;
use App\Models\Location;
use App\Services\ActivityLogger;
use App\Services\JobWorkflowService;
use App\Services\ProjectBriefingService;
use App\Services\WorkspaceAuthorizer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class JobController extends Controller
{
    public function __construct(private readonly JobWorkflowService $workflows, private readonly ActivityLogger $activity) {}

    public function workflows(): array
    {
        return $this->workflows->catalog();
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate(['paginate' => ['sometimes', 'boolean'], 'project_type' => ['nullable', Rule::in(Job::PROJECT_TYPES)]] + ($request->boolean('paginate') ? ['per_page' => ['sometimes', 'integer', 'min:1', 'max:48'], 'page' => ['sometimes', 'integer', 'min:1', 'max:100000']] : []));
        $jobs = Job::query()->accessibleBy($request->user())->with(['client', 'location'])
            ->withCount(['tasks', 'tasks as open_tasks_count' => fn ($q) => $q->open(), 'sessions', 'deliveries'])
            ->search($request->string('search')->toString())
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->when($request->specialty, fn ($q, $specialty) => $q->where('specialty', $specialty))
            ->when($request->project_type, fn ($q, $type) => $q->where('project_type', $type))
            ->orderByRaw('event_date IS NULL')->orderBy('event_date')->orderByDesc('created_at')->orderByDesc('id');

        return JobResource::collection($request->boolean('paginate') ? $jobs->paginate((int) $request->input('per_page', 12)) : $jobs->get());
    }

    public function store(JobRequest $request): JobResource
    {
        $job = DB::transaction(function () use ($request): Job {
            $data = $request->validated();
            $job = $request->user()->jobs()->create(Arr::except($data, ['gear_item_ids', 'location_ids', 'create_workflow_tasks']));
            $job->gearItems()->sync($data['gear_item_ids'] ?? []);
            $job->locations()->sync($data['location_ids'] ?? []);
            if ($data['create_workflow_tasks'] ?? true) {
                $this->workflows->seedTasks($job);
            }
            $this->activity->log($request->user(), $job, ActivityLogger::CREATED, "Trabajo creado: {$job->title}");

            return $job;
        });

        return new JobResource($this->loadJob($job));
    }

    public function show(Request $request, Job $job): JobResource
    {
        $this->ensureOwnership($request, $job);

        return new JobResource($this->loadJob($job));
    }

    public function update(JobRequest $request, Job $job): JobResource
    {
        $this->ensureOwnership($request, $job);
        DB::transaction(function () use ($request, $job): void {
            $data = $request->validated();
            $previousStatus = $job->status;
            $previousContract = $job->contract_status;
            $job->update(Arr::except($data, ['gear_item_ids', 'location_ids', 'create_workflow_tasks']));
            if (array_key_exists('gear_item_ids', $data)) {
                $job->gearItems()->sync($data['gear_item_ids']);
            }
            if (array_key_exists('location_ids', $data)) {
                $job->locations()->sync($data['location_ids']);
            }
            if ($previousContract !== 'signed' && $job->contract_status === 'signed') {
                $job->update(['contract_signed_at' => now()]);
            }
            $this->activity->logStatusChange($request->user(), $job, $previousStatus, $job->status);
        });

        return new JobResource($this->loadJob($job->refresh()));
    }

    public function destroy(Request $request, Job $job): mixed
    {
        $this->ensureOwnership($request, $job);
        abort_if($job->sessions()->exists() || $job->quotes()->exists() || $job->deliveries()->exists() || $job->contracts()->exists(), 422, 'No se puede eliminar un trabajo con actividad asociada.');
        $job->delete();

        return response()->noContent();
    }

    private function loadJob(Job $job): Job
    {
        return $job->load(['client', 'location', 'locations', 'gearItems', 'sessions.location', 'quotes.client', 'quotes.items', 'quotes.invoice', 'invoices.client', 'contracts.client', 'tasks', 'deliveries.client', 'activities']);
    }

    public function briefing(ProjectBriefingRequest $request, Job $job, ProjectBriefingService $briefings): JobResource
    {
        $updated = $briefings->save($request->user(), $job, $request->validated('briefing'), $request->integer('revision'));

        return new JobResource($this->loadJob($updated));
    }

    public function options(Request $request, ?Job $job = null): AnonymousResourceCollection
    {
        if ($job) {
            $this->ensureOwnership($request, $job);
        }
        $workspaceId = $job?->workspace_id ?? app(WorkspaceAuthorizer::class)->workspaceForRequest($request);
        $data = $request->validate(['resource' => ['required', Rule::in(['clients', 'locations', 'gear'])], 'search' => ['nullable', 'string', 'max:120'], 'page' => ['sometimes', 'integer', 'min:1', 'max:100000']]);
        $model = ['clients' => Client::class, 'locations' => Location::class, 'gear' => GearItem::class][$data['resource']];

        return JsonResource::collection($model::query()->where('workspace_id', $workspaceId)->select('id', 'name')
            ->when($data['search'] ?? null, fn ($q, $search) => $q->where('name', 'like', '%'.$search.'%'))->orderBy('name')->orderBy('id')->paginate(24));
    }

    private function ensureOwnership(Request $request, Job $job): void
    {
        app(WorkspaceAuthorizer::class)->requireAccessOr404($request->user(), $job);
    }
}
