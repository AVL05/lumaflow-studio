<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deliveries', function (Blueprint $table): void {
            $table->unsignedBigInteger('client_id')->nullable()->change();
            $table->unsignedInteger('version')->default(0);
            $table->unsignedInteger('revision_number')->default(0);
            $table->string('review_state', 30)->nullable();
            $table->timestamp('portal_revoked_at')->nullable();
        });
        Schema::create('delivery_revisions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('delivery_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('number');
            $table->string('gallery_url', 2048)->nullable();
            $table->string('gallery_provider', 50)->nullable();
            $table->string('gallery_password')->nullable();
            $table->date('delivery_date')->nullable();
            $table->text('notes')->nullable();
            $table->text('legacy_client_message')->nullable();
            $table->timestamp('legacy_responded_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('author_name')->nullable();
            $table->uuid('request_id')->nullable();
            $table->char('payload_hash', 64)->nullable();
            $table->boolean('legacy')->default(false);
            $table->boolean('published')->default(true);
            $table->timestamps();
            $table->unique(['delivery_id', 'number']);
            $table->unique(['delivery_id', 'request_id']);
        });
        DB::table('deliveries')->orderBy('id')->chunkById(100, function ($deliveries): void {
            foreach ($deliveries as $delivery) {
                DB::table('delivery_revisions')->insert([
                    'delivery_id' => $delivery->id, 'number' => 1,
                    'gallery_url' => $delivery->gallery_url, 'gallery_provider' => $delivery->gallery_provider,
                    'gallery_password' => $delivery->gallery_password, 'delivery_date' => $delivery->delivery_date,
                    'legacy_client_message' => $delivery->client_message, 'legacy_responded_at' => $delivery->client_responded_at,
                    'legacy' => true, 'published' => $delivery->status !== 'draft', 'created_at' => now(), 'updated_at' => now(),
                ]);
                DB::table('deliveries')->where('id', $delivery->id)->update(['revision_number' => 1]);
            }
        });
    }

    public function down(): void
    {
        // Retain history and personal deliveries: rollback requires an exported, verified backup.
        throw new LogicException('Forward-only migration: preserve delivery revisions and nullable clients.');
    }
};
