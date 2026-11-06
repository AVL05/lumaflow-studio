<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('photography_jobs', function (Blueprint $table): void {
            $table->string('project_type', 20)->default('photography');
            $table->json('participants')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->date('delivery_due_date')->nullable();
            $table->json('external_links')->nullable();
            $table->json('briefing')->nullable();
            $table->unsignedInteger('briefing_revision')->default(0);
        });
        Schema::create('job_location', function (Blueprint $table): void {
            $table->foreignId('job_id')->constrained('photography_jobs')->cascadeOnDelete();
            $table->foreignId('location_id')->constrained('locations')->cascadeOnDelete();
            $table->primary(['job_id', 'location_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_location');
        Schema::table('photography_jobs', fn (Blueprint $table) => $table->dropColumn(['project_type', 'participants', 'start_date', 'end_date', 'delivery_due_date', 'external_links', 'briefing', 'briefing_revision']));
    }
};
