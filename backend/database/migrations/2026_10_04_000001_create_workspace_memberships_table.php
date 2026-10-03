<?php

use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspace_memberships', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 20)->default('member');
            $table->timestamps();

            $table->unique(['workspace_id', 'user_id']);
            $table->index(['user_id', 'role']);
        });

        $this->backfillOwners();
    }

    public function down(): void
    {
        Schema::dropIfExists('workspace_memberships');
    }

    /**
     * Todo workspace funcional necesita un owner. El propietario registrado
     * en `workspaces.user_id` queda representado como membership `owner`.
     * Idempotente gracias a la constraint unica.
     */
    private function backfillOwners(): void
    {
        Workspace::query()->chunkById(200, function ($workspaces): void {
            foreach ($workspaces as $workspace) {
                if (! User::query()->whereKey($workspace->user_id)->exists()) {
                    continue;
                }

                WorkspaceMembership::query()->firstOrCreate(
                    ['workspace_id' => $workspace->getKey(), 'user_id' => $workspace->user_id],
                    ['role' => WorkspaceMembership::ROLE_OWNER]
                );
            }
        });
    }
};
