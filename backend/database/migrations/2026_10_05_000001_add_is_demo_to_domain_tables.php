<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Tablas que el workspace de ejemplo rellena. */
    private const TABLES = [
        'locations' => 'name',
        'clients' => 'name',
        'photography_jobs' => 'title',
        'sessions' => 'name',
        'deliveries' => 'title',
        'tasks' => 'title',
    ];

    public function up(): void
    {
        foreach (array_keys(self::TABLES) as $table) {
            Schema::table($table, function (Blueprint $table): void {
                $table->boolean('is_demo')->default(false)->after('workspace_id');
            });
        }

        $this->backfill();
    }

    public function down(): void
    {
        foreach (array_keys(self::TABLES) as $table) {
            Schema::table($table, function (Blueprint $table): void {
                $table->dropColumn('is_demo');
            });
        }
    }

    /**
     * Marca las filas creadas por el servicio de ejemplo: nombres con
     * `· Ejemplo` y emails de `@example.test`. Solo toca datos que el propio
     * servicio genera, nunca recursos reales del usuario.
     */
    private function backfill(): void
    {
        foreach (self::TABLES as $table => $column) {
            DB::table($table)
                ->where($column, 'like', '%· Ejemplo%')
                ->update(['is_demo' => true]);
        }

        DB::table('clients')
            ->where('email', 'like', '%@example.test')
            ->update(['is_demo' => true]);
    }
};
