<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('photography_jobs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('specialty')->default('other');
            $table->string('workflow_key')->default('general');
            $table->string('status')->default('lead');
            $table->date('event_date')->nullable();
            $table->text('description')->nullable();
            $table->decimal('budget', 10, 2)->nullable();
            $table->decimal('deposit_amount', 10, 2)->default(0);
            $table->string('contract_status')->default('not_required');
            $table->string('contract_url')->nullable();
            $table->timestamp('contract_signed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'event_date']);
            $table->index(['user_id', 'specialty']);
        });

        Schema::create('gear_item_job', function (Blueprint $table): void {
            $table->foreignId('job_id')->constrained('photography_jobs')->cascadeOnDelete();
            $table->foreignId('gear_item_id')->constrained()->cascadeOnDelete();
            $table->primary(['job_id', 'gear_item_id']);
        });

        foreach (['sessions', 'deliveries', 'quotes', 'invoices', 'tasks'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName): void {
                $table->foreignId('job_id')->nullable()->after('user_id')->constrained('photography_jobs')->nullOnDelete();
                $table->index(['user_id', 'job_id'], "{$tableName}_user_job_index");
            });
        }

        $this->backfillJobs();
    }

    private function backfillJobs(): void
    {
        $now = now();

        DB::table('deliveries')->orderBy('id')->each(function (object $delivery) use ($now): void {
            $session = $delivery->session_id ? DB::table('sessions')->find($delivery->session_id) : null;
            $status = match ($delivery->status) {
                'pending' => 'review',
                'delivered', 'approved' => 'delivered',
                'archived' => 'closed',
                default => 'lead',
            };
            $jobId = DB::table('photography_jobs')->insertGetId([
                'user_id' => $delivery->user_id,
                'client_id' => $delivery->client_id,
                'location_id' => $session?->location_id,
                'title' => $delivery->title,
                'specialty' => $session?->session_type ?: 'other',
                'workflow_key' => $session?->session_type ?: 'general',
                'status' => $status,
                'event_date' => $session?->date,
                'budget' => $delivery->budget,
                'created_at' => $delivery->created_at ?: $now,
                'updated_at' => $now,
            ]);
            DB::table('deliveries')->where('id', $delivery->id)->update(['job_id' => $jobId]);
            if ($session) {
                DB::table('sessions')->where('id', $session->id)->whereNull('job_id')->update(['job_id' => $jobId]);
                foreach (['quotes', 'invoices', 'tasks'] as $related) {
                    DB::table($related)->where('session_id', $session->id)->whereNull('job_id')->update(['job_id' => $jobId]);
                }
            }
        });

        DB::table('sessions')->whereNull('job_id')->orderBy('id')->each(function (object $session) use ($now): void {
            $clientId = DB::table('clients')->where('user_id', $session->user_id)
                ->where('name', $session->client_name)->value('id');
            $status = match ($session->status) {
                'confirmed' => 'preparation', 'completed' => 'editing', 'editing' => 'editing',
                'delivered' => 'delivered', 'cancelled' => 'cancelled', default => 'lead',
            };
            $jobId = DB::table('photography_jobs')->insertGetId([
                'user_id' => $session->user_id,
                'client_id' => $clientId,
                'location_id' => $session->location_id,
                'title' => $session->name,
                'specialty' => $session->session_type ?: 'other',
                'workflow_key' => $session->session_type ?: 'general',
                'status' => $status,
                'event_date' => $session->date,
                'description' => $session->description,
                'created_at' => $session->created_at ?: $now,
                'updated_at' => $now,
            ]);
            DB::table('sessions')->where('id', $session->id)->update(['job_id' => $jobId]);
            foreach (['quotes', 'invoices', 'tasks'] as $related) {
                DB::table($related)->where('session_id', $session->id)->whereNull('job_id')->update(['job_id' => $jobId]);
            }
        });
    }

    public function down(): void
    {
        foreach (['sessions', 'deliveries', 'quotes', 'invoices', 'tasks'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName): void {
                $table->dropIndex("{$tableName}_user_job_index");
                $table->dropConstrainedForeignId('job_id');
            });
        }
        Schema::dropIfExists('gear_item_job');
        Schema::dropIfExists('photography_jobs');
    }
};
