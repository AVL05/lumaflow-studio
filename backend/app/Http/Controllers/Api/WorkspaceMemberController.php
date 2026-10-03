<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\WorkspaceMemberResource;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use App\Services\WorkspaceAuthorizer;
use App\Services\WorkspaceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class WorkspaceMemberController extends Controller
{
    public function __construct(
        private readonly WorkspaceAuthorizer $authorizer,
        private readonly WorkspaceService $workspaces,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $workspace = $this->workspaces->ensureCurrentWorkspace($request->user());

        abort_unless($workspace, 404);

        $members = WorkspaceMembership::query()
            ->where('workspace_id', $workspace->getKey())
            ->with('user:id,name,email')
            ->orderByRaw("CASE role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END")
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => WorkspaceMemberResource::collection($members),
            'meta' => ['role' => $this->authorizer->role($request->user(), (int) $workspace->getKey())],
        ]);
    }

    public function destroy(Request $request, int $userId): Response
    {
        $workspace = $this->workspaces->ensureCurrentWorkspace($request->user());

        abort_unless($workspace, 404);

        $target = WorkspaceMembership::query()
            ->where('workspace_id', $workspace->getKey())
            ->where('user_id', $userId)
            ->firstOrFail();

        abort_unless($this->authorizer->canRemove($request->user(), (int) $workspace->getKey(), $target), 403);

        $this->workspaces->removeMembership($target);

        return response()->noContent();
    }

    /**
     * Cambia el workspace actual. Solo entre workspaces con membership;
     * no es un selector general, solo coherencia minima (Issue #5).
     */
    public function updateCurrent(Request $request): JsonResponse
    {
        $data = $request->validate(['workspace_id' => ['required', 'integer', 'exists:workspaces,id']]);

        $workspaceId = (int) $data['workspace_id'];

        abort_unless($this->authorizer->isMember($request->user(), $workspaceId), 404);

        $request->user()->forceFill(['current_workspace_id' => $workspaceId])->saveQuietly();

        $workspace = Workspace::query()->findOrFail($workspaceId);

        return response()->json([
            'data' => [
                'id' => $workspace->getKey(),
                'name' => $workspace->getAttribute('name'),
                'role' => $this->authorizer->role($request->user(), $workspaceId),
            ],
        ]);
    }
}
