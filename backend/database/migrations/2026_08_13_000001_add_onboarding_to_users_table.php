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
            $table->string('studio_name')->nullable()->after('name');
            $table->json('photography_specialties')->nullable()->after('calendar_token');
            $table->char('country', 2)->nullable()->after('photography_specialties');
            $table->char('currency', 3)->nullable()->after('country');
            $table->string('onboarding_goal', 40)->nullable()->after('currency');
            $table->timestamp('onboarding_completed_at')->nullable()->after('onboarding_goal');
        });

        // Las cuentas anteriores al onboarding conservan acceso al producto.
        DB::table('users')->update([
            'studio_name' => DB::raw('name'),
            'email_verified_at' => DB::raw('COALESCE(email_verified_at, CURRENT_TIMESTAMP)'),
            'country' => 'ES',
            'currency' => 'EUR',
            'onboarding_completed_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'studio_name',
                'photography_specialties',
                'country',
                'currency',
                'onboarding_goal',
                'onboarding_completed_at',
            ]);
        });
    }
};
