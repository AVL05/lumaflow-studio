<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\JobRequest;
use App\Http\Resources\JobResource;
use App\Models\Job;
use App\Services\ActivityLogger;
use App\Services\JobWorkflowService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class JobController extends Controller
{
    public function __construct(private readonly JobWorkflowService $workflows, private readonly ActivityLogger $activity) {}

    public function workflows(): array
    {
        return $this->workflows->catalog();
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $jobs = Job::query()->ownedBy($request->user()->id)->with(['client', 'location'])
            ->withCount(['tasks', 'tasks as open_tasks_count' => fn ($q) => $q->open(), 'sessions', 'deliveries'])
            ->search($request->string('search')->toString())
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->when($request->specialty, fn ($q, $specialty) => $q->where('specialty', $specialty))
            ->orderByRaw('event_date IS NULL')->orderBy('event_date')->orderByDesc('created_at')->get();

        return JobResource::collection($jobs);
    }

    public function store(JobRequest $request): JobResource
    {
        $job = DB::transaction(function () use ($request): Job {
            $data = $request->validated();
            $job = $request->user()->jobs()->create(Arr::except($data, ['gear_item_ids', 'create_workflow_tasks']));
            $job->gearItems()->sync($data['gear_item_ids'] ?? []);
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
        $data = $request->validated();
        $previousStatus = $job->status;
        $previousContract = $job->contract_status;
        $job->update(Arr::except($data, ['gear_item_ids', 'create_workflow_tasks']));
        if (array_key_exists('gear_item_ids', $data)) {
            $job->gearItems()->sync($data['gear_item_ids']);
        }
        if ($previousContract !== 'signed' && $job->contract_status === 'signed') {
            $job->update(['contract_signed_at' => now()]);
        }
        $this->activity->logStatusChange($request->user(), $job, $previousStatus, $job->status);

        return new JobResource($this->loadJob($job->refresh()));
    }

    public function destroy(Request $request, Job $job): mixed
    {
        $this->ensureOwnership($request, $job);
        abort_if($job->sessions()->exists() || $job->quotes()->exists() || $job->deliveries()->exists(), 422, 'No se puede eliminar un trabajo con actividad asociada.');
        $job->delete();

        return response()->noContent();
    }

    private function loadJob(Job $job): Job
    {
        return $job->load(['client', 'location', 'gearItems', 'sessions.location', 'quotes.client', 'quotes.items', 'quotes.invoice', 'invoices.client', 'tasks', 'deliveries.client', 'deliveries.images', 'activities']);
    }

    private function ensureOwnership(Request $request, Job $job): void
    {
        abort_unless($job->user_id === $request->user()->id, 404);
    }
}
