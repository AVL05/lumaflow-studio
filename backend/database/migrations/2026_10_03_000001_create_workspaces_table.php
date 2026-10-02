<?php

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspaces', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 160);
            $table->string('slug', 160)->unique();
            $table->timestamps();

            $table->unique('user_id');
            $table->index('slug');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->foreignId('current_workspace_id')->nullable()->after('remember_token')->constrained('workspaces')->nullOnDelete();
        });

        $this->backfill();
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('current_workspace_id');
        });

        Schema::dropIfExists('workspaces');
    }

    /**
     * Cada usuario existente recibe su estudio personal sin perder datos.
     * Idempotente: no duplica workspaces si ya existen.
     */
    private function backfill(): void
    {
        User::query()->whereNull('current_workspace_id')->chunkById(200, function ($users): void {
            foreach ($users as $user) {
                $existing = Workspace::query()->where('user_id', $user->getKey())->first();

                if (! $existing instanceof Workspace) {
                    $existing = Workspace::query()->create([
                        'user_id' => $user->getKey(),
                        'name' => $user->getAttribute('studio_name') ?: $user->getAttribute('name') ?: 'Mi estudio',
                        'slug' => $this->uniqueSlug($user),
                    ]);
                }

                $user->forceFill(['current_workspace_id' => $existing->getKey()])->saveQuietly();
            }
        });
    }

    private function uniqueSlug(User $user): string
    {
        $seed = $user->getAttribute('studio_slug') ?: $user->getAttribute('name') ?: 'estudio';
        $base = Str::slug($seed) ?: 'estudio';
        $slug = $base;
        $suffix = 1;

        while (Workspace::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.(++$suffix);
        }

        return $slug;
    }
};
