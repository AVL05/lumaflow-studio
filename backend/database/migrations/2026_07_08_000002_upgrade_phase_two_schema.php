<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const SESSION_STATUSES = ['planned', 'confirmed', 'completed', 'editing', 'delivered', 'cancelled'];

    private const GEAR_CATEGORIES = ['camera', 'lens', 'filter', 'flash', 'light', 'tripod', 'gimbal', 'drone', 'gopro', 'mobile', 'accessory', 'battery', 'sd_card'];

    public function up(): void
    {
        Schema::table('sessions', function (Blueprint $table): void {
            $table->time('time')->nullable()->after('date');
            $table->text('description')->nullable()->after('status');
            $table->string('client_name')->nullable()->after('notes');
        });

        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE sessions MODIFY status ENUM('planned','confirmed','completed','editing','delivered','cancelled') DEFAULT 'planned'");
        }
        $this->replaceEnumCheck('sessions', 'status', self::SESSION_STATUSES);

        Schema::table('gear_items', function (Blueprint $table): void {
            $table->unsignedInteger('weight_grams')->nullable()->after('model');
            $table->string('condition')->default('active')->after('weight_grams');
            $table->date('purchase_date')->nullable()->after('condition');
            $table->decimal('purchase_price', 10, 2)->nullable()->after('purchase_date');
        });

        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE gear_items MODIFY category ENUM('camera','lens','filter','flash','light','tripod','gimbal','drone','gopro','mobile','accessory','battery','sd_card')");
        }
        $this->replaceEnumCheck('gear_items', 'category', self::GEAR_CATEGORIES);
    }

    public function down(): void
    {
        Schema::table('gear_items', function (Blueprint $table): void {
            $table->dropColumn(['weight_grams', 'condition', 'purchase_date', 'purchase_price']);
        });

        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE gear_items MODIFY category ENUM('camera','lens','filter','tripod','light','gopro','mobile','accessory','battery','sd_card')");
        }
        $this->replaceEnumCheck('gear_items', 'category', ['camera', 'lens', 'filter', 'tripod', 'light', 'gopro', 'mobile', 'accessory', 'battery', 'sd_card']);

        Schema::table('sessions', function (Blueprint $table): void {
            $table->dropColumn(['time', 'description', 'client_name']);
        });

        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE sessions MODIFY status ENUM('planned','completed','editing','delivered') DEFAULT 'planned'");
        }
        $this->replaceEnumCheck('sessions', 'status', ['planned', 'completed', 'editing', 'delivered']);
    }

    /**
     * En PostgreSQL Laravel implementa `enum` como varchar + CHECK (`<tabla>_<columna>_check`):
     * ampliar los valores exige sustituir la restriccion (MySQL usa MODIFY, arriba).
     *
     * @param  list<string>  $values
     */
    private function replaceEnumCheck(string $table, string $column, array $values): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        $list = implode(', ', array_map(fn (string $value): string => "'{$value}'", $values));

        DB::statement("ALTER TABLE \"{$table}\" DROP CONSTRAINT IF EXISTS \"{$table}_{$column}_check\"");
        DB::statement("ALTER TABLE \"{$table}\" ADD CONSTRAINT \"{$table}_{$column}_check\" CHECK (\"{$column}\" IN ({$list}))");
    }
};
