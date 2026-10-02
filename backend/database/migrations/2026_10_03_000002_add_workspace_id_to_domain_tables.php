<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tablas raiz con `user_id` directo que reciben `workspace_id` aditivo.
     * `quote_items` y `checklist_items` heredan ownership y quedan fuera.
     *
     * @var string[]
     */
    private const TABLES = [
        'clients',
        'photography_jobs',
        'sessions',
        'tasks',
        'checklists',
        'deliveries',
        'quotes',
        'invoices',
        'locations',
        'gear_items',
        'presets',
        'booking_requests',
        'activities',
        'notifications',
        'ai_conversations',
        'ai_messages',
        'ai_analyses',
        'ai_session_plans',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $table): void {
                $table->foreignId('workspace_id')->nullable()->after('user_id')->constrained('workspaces')->nullOnDelete();
            });
        }

        $this->backfill();
    }

    public function down(): void
    {
        foreach (array_reverse(self::TABLES) as $table) {
            Schema::table($table, function (Blueprint $table): void {
                $table->dropConstrainedForeignId('workspace_id');
            });
        }
    }

    /**
     * Rellena `workspace_id` desde el workspace actual del propietario.
     * Portable MySQL/SQLite mediante subconsulta; solo toca filas NULL.
     */
    private function backfill(): void
    {
        foreach (self::TABLES as $table) {
            DB::table($table)
                ->whereNull('workspace_id')
                ->whereNotNull('user_id')
                ->update([
                    'workspace_id' => DB::raw('(SELECT current_workspace_id FROM users WHERE users.id = '.$table.'.user_id)'),
                ]);
        }
    }
};
