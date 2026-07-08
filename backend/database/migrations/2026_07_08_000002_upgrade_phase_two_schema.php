<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sessions', function (Blueprint $table): void {
            $table->time('time')->nullable()->after('date');
            $table->text('description')->nullable()->after('status');
            $table->string('client_name')->nullable()->after('notes');
        });

        DB::statement("ALTER TABLE sessions MODIFY status ENUM('planned','confirmed','completed','editing','delivered','cancelled') DEFAULT 'planned'");

        Schema::table('gear_items', function (Blueprint $table): void {
            $table->unsignedInteger('weight_grams')->nullable()->after('model');
            $table->string('condition')->default('active')->after('weight_grams');
            $table->date('purchase_date')->nullable()->after('condition');
            $table->decimal('purchase_price', 10, 2)->nullable()->after('purchase_date');
        });

        DB::statement("ALTER TABLE gear_items MODIFY category ENUM('camera','lens','filter','flash','light','tripod','gimbal','drone','gopro','mobile','accessory','battery','sd_card')");

        Schema::table('photos', function (Blueprint $table): void {
            $table->string('file_name')->nullable()->after('thumbnail_path');
            $table->unsignedBigInteger('file_size')->nullable()->after('file_name');
            $table->string('mime_type')->nullable()->after('file_size');
            $table->date('taken_at')->nullable()->after('mime_type');
        });
    }

    public function down(): void
    {
        Schema::table('photos', function (Blueprint $table): void {
            $table->dropColumn(['file_name', 'file_size', 'mime_type', 'taken_at']);
        });

        Schema::table('gear_items', function (Blueprint $table): void {
            $table->dropColumn(['weight_grams', 'condition', 'purchase_date', 'purchase_price']);
        });

        DB::statement("ALTER TABLE gear_items MODIFY category ENUM('camera','lens','filter','tripod','light','gopro','mobile','accessory','battery','sd_card')");

        Schema::table('sessions', function (Blueprint $table): void {
            $table->dropColumn(['time', 'description', 'client_name']);
        });

        DB::statement("ALTER TABLE sessions MODIFY status ENUM('planned','completed','editing','delivered') DEFAULT 'planned'");
    }
};
