<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_templates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->json('definition');
            $table->unsignedInteger('revision')->default(0);
            $table->timestamps();
            $table->index(['workspace_id', 'id']);
        });
        Schema::create('postproduction_stages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('job_id')->constrained('photography_jobs')->cascadeOnDelete();
            $table->string('key', 60);
            $table->string('label', 120);
            $table->string('status', 20)->default('pending');
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('due_date')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->unsignedInteger('revision')->default(0);
            $table->timestamps();
            $table->unique(['job_id', 'key']);
            $table->index(['job_id', 'position']);
        });
        Schema::table('tasks', function (Blueprint $table): void {
            $table->foreignId('stage_id')->nullable()->constrained('postproduction_stages')->nullOnDelete();
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('workflow_phase', 20)->nullable();
            $table->unsignedInteger('revision')->default(0);
        });
        Schema::table('checklists', function (Blueprint $table): void {
            $table->foreignId('job_id')->nullable()->constrained('photography_jobs')->cascadeOnDelete();
            $table->foreignId('stage_id')->nullable()->constrained('postproduction_stages')->nullOnDelete();
        });
        Schema::create('project_template_applications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('job_id')->constrained('photography_jobs')->cascadeOnDelete();
            $table->string('template_key', 80);
            $table->string('template_name', 120);
            $table->unsignedInteger('template_revision');
            $table->string('preview_hash', 64);
            $table->timestamp('created_at');
            $table->unique(['job_id', 'template_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_template_applications');
        Schema::table('checklists', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('stage_id');
            $table->dropConstrainedForeignId('job_id');
        });
        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('stage_id');
            $table->dropConstrainedForeignId('assigned_user_id');
            $table->dropColumn(['workflow_phase', 'revision']);
        });
        Schema::dropIfExists('postproduction_stages');
        Schema::dropIfExists('project_templates');
    }
};
