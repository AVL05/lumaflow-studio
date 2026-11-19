<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChecklistRequest;
use App\Http\Requests\ProjectWorkflowRequest;
use App\Http\Requests\TaskRequest;
use App\Http\Resources\ChecklistResource;
use App\Http\Resources\PostproductionStageResource;
use App\Http\Resources\TaskResource;
use App\Models\Job;
use App\Models\PostproductionStage;
use App\Models\ProjectTemplate;
use App\Models\WorkspaceMembership;
use App\Services\JobWorkflowService;
use App\Services\WorkspaceAuthorizer;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class ProjectWorkflowController extends Controller
{
    public function createTask(TaskRequest $request, Job $job, TaskController $tasks): mixed
    {
        return $tasks->store($request);
    }

    public function createChecklist(ChecklistRequest $request, Job $job, ChecklistController $checklists): mixed
    {
        return $checklists->store($request);
    }

    public function __construct(private readonly JobWorkflowService $workflows) {}

    private function authorizeJob(Request $request, Job $job): void
    {
        app(WorkspaceAuthorizer::class)->requireAccessOr404($request->user(), $job);
    }

    public function show(Request $request, Job $job): mixed
    {
        $this->authorizeJob($request, $job);
        $members = WorkspaceMembership::query()->where('workspace_id', $job->workspace_id)->with('user:id,name')->get()->map(fn ($m) => ['id' => $m->user_id, 'name' => $m->user->name, 'role' => $m->role]);

        return response()->json(['data' => [
            'stages' => PostproductionStageResource::collection($job->stages()->with(['tasks', 'checklists.items'])->get()),
            'tasks' => TaskResource::collection($job->tasks()->whereNull('stage_id')->get()),
            'checklists' => ChecklistResource::collection($job->checklists()->whereNull('stage_id')->with('items')->get()),
            'members' => $members,
            'applications' => DB::table('project_template_applications')->where('job_id', $job->id)->orderBy('id')->get(['template_key', 'template_name', 'template_revision', 'created_at']),
        ]]);
    }

    public function templates(Request $request, Job $job): mixed
    {
        $this->authorizeJob($request, $job);
        $request->validate(['page' => ['sometimes', 'integer', 'min:1', 'max:100000']]);
        $page = ProjectTemplate::query()->where('workspace_id', $job->workspace_id)->orderBy('name')->orderBy('id')->paginate(12);

        return response()->json(['builtins' => array_values(config('project_templates')), 'data' => $page->getCollection()->map(fn ($t) => ['key' => 'custom-'.$t->id, ...$t->only(['name', 'description', 'definition', 'revision'])]), 'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()]]);
    }

    public function preview(Request $request, Job $job, string $key): mixed
    {
        $this->authorizeJob($request, $job);

        return response()->json(['data' => $this->workflows->preview($job, $this->workflows->template($job, $key))]);
    }

    public function apply(ProjectWorkflowRequest $request, Job $job, string $key): mixed
    {
        return response()->json(['data' => $this->workflows->applyTemplate($request->user(), $job, $key, $request->validated('preview_hash'))]);
    }

    public function saveTemplate(ProjectWorkflowRequest $request, Job $job, ?string $key = null): mixed
    {
        $data = $request->validated();
        $template = DB::transaction(function () use ($request, $job, $key, $data): ProjectTemplate {
            if (! $key) {
                return ProjectTemplate::create(Arr::except($data, ['revision']) + ['workspace_id' => $job->workspace_id, 'user_id' => $request->user()->id]);
            }
            abort_unless(preg_match('/^custom-\d+$/', $key), 404);
            if (DB::getDriverName() === 'sqlite') {
                DB::table('project_templates')->where('id', (int) substr($key, 7))->where('workspace_id', $job->workspace_id)->update(['id' => (int) substr($key, 7)]);
            }
            $template = ProjectTemplate::query()->where('workspace_id', $job->workspace_id)->lockForUpdate()->findOrFail((int) substr($key, 7));
            abort_unless($template->revision === (int) $data['revision'], 409, 'La plantilla ha cambiado. Conserva tu borrador y recarga.');
            $template->update(Arr::except($data, ['revision']) + ['revision' => $template->revision + 1]);

            return $template;
        }, 3);

        return response()->json(['data' => ['key' => 'custom-'.$template->id, ...$template->only(['name', 'description', 'definition', 'revision'])]], $key ? 200 : 201);
    }

    public function initialize(ProjectWorkflowRequest $request, Job $job): mixed
    {
        $this->workflows->initialize($request->user(), $job);

        return response()->json(['message' => 'Pipeline preparado.']);
    }

    public function createStage(ProjectWorkflowRequest $request, Job $job): mixed
    {
        $stage = $this->workflows->createStage($request->user(), $job, $request->validated());

        return new PostproductionStageResource($stage->load(['tasks', 'checklists.items']));
    }

    public function updateStage(ProjectWorkflowRequest $request, Job $job, PostproductionStage $stage): mixed
    {
        $stage = $this->workflows->updateStage($request->user(), $job, $stage, $request->validated());

        return new PostproductionStageResource($stage->load(['tasks', 'checklists.items']));
    }

    public function moveStage(ProjectWorkflowRequest $request, Job $job, PostproductionStage $stage): mixed
    {
        $this->workflows->moveStage($job, $stage, $request->validated('direction'), $request->integer('revision'));

        return response()->json(['message' => 'Orden actualizado.']);
    }
}
