<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sessions', function (Blueprint $table): void {
            $table->time('end_time')->nullable();
            $table->json('participants')->nullable();
            $table->text('incidents')->nullable();
        });
        Schema::create('shots', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('job_id')->constrained('photography_jobs')->cascadeOnDelete();
            $table->foreignId('session_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $table->string('scene', 120)->nullable();
            $table->text('description');
            $table->string('shot_type', 120)->nullable();
            $table->string('camera_movement', 120)->nullable();
            $table->string('focal_length', 120)->nullable();
            $table->unsignedInteger('estimated_seconds')->nullable();
            $table->time('scheduled_time')->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('pending');
            $table->unsignedInteger('position')->default(0);
            $table->unsignedInteger('revision')->default(0);
            $table->timestamps();
            $table->index(['job_id', 'position', 'id']);
            $table->index(['session_id', 'scheduled_time']);
        });
        Schema::create('gear_item_shot', function (Blueprint $table): void {
            $table->foreignId('shot_id')->constrained()->cascadeOnDelete();
            $table->foreignId('gear_item_id')->constrained()->cascadeOnDelete();
            $table->primary(['shot_id', 'gear_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gear_item_shot');
        Schema::dropIfExists('shots');
        Schema::table('sessions', fn (Blueprint $table) => $table->dropColumn(['end_time', 'participants', 'incidents']));
    }
};
