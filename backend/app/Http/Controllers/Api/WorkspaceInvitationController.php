<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\WorkspaceInvitationResource;
use App\Http\Resources\WorkspaceMemberResource;
use App\Models\WorkspaceInvitation;
use App\Models\WorkspaceMembership;
use App\Services\WorkspaceAuthorizer;
use App\Services\WorkspaceInvitationService;
use App\Services\WorkspaceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class WorkspaceInvitationController extends Controller
{
    public function __construct(
        private readonly WorkspaceAuthorizer $authorizer,
        private readonly WorkspaceService $workspaces,
        private readonly WorkspaceInvitationService $invitations,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $workspace = $this->workspaces->ensureCurrentWorkspace($request->user());

        abort_unless($workspace, 404);
        abort_unless($this->authorizer->canRevoke($request->user(), (int) $workspace->getKey()), 403);

        $pending = WorkspaceInvitation::query()
            ->where('workspace_id', $workspace->getKey())
            ->pending()
            ->with('inviter:id,name')
            ->orderByDesc('id')
            ->get();

        return response()->json(['data' => WorkspaceInvitationResource::collection($pending)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email:rfc', 'max:160'],
            'role' => ['required', 'in:'.WorkspaceMembership::ROLE_ADMIN.','.WorkspaceMembership::ROLE_MEMBER],
        ]);

        $workspace = $this->workspaces->ensureCurrentWorkspace($request->user());

        abort_unless($workspace, 404);

        ['invitation' => $invitation, 'token' => $token] = $this->invitations->invite(
            $request->user(),
            (int) $workspace->getKey(),
            $data['email'],
            $data['role']
        );

        return response()->json([
            'data' => new WorkspaceInvitationResource($invitation),
            // El token plano solo se expone aqui para copiarlo en el aviso.
            'meta' => ['token' => $token],
        ], 201);
    }

    public function destroy(Request $request, int $invitation): Response
    {
        $this->invitations->revoke($request->user(), $invitation);

        return response()->noContent();
    }

    public function accept(Request $request): JsonResponse
    {
        $data = $request->validate(['token' => ['required', 'string', 'min:32', 'max:128']]);

        $membership = $this->invitations->accept($request->user(), $data['token']);

        return response()->json(['data' => new WorkspaceMemberResource($membership->load('user:id,name,email'))], 201);
    }
}
