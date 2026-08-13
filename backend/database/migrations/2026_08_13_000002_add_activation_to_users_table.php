<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('getting_started_choice', 40)->nullable()->after('onboarding_completed_at');
            $table->timestamp('getting_started_completed_at')->nullable()->after('getting_started_choice');
            $table->timestamp('sample_workspace_activated_at')->nullable()->after('getting_started_completed_at');
            $table->timestamp('bookings_enabled_at')->nullable()->after('sample_workspace_activated_at');
        });

        // Las cuentas existentes conservan el acceso y sus enlaces publicos.
        DB::table('users')->update([
            'getting_started_choice' => 'existing_account',
            'getting_started_completed_at' => now(),
            'bookings_enabled_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'getting_started_choice',
                'getting_started_completed_at',
                'sample_workspace_activated_at',
                'bookings_enabled_at',
            ]);
        });
    }
};
