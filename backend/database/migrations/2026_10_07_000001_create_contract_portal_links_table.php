<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contract_portal_links', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            // Solo el hash SHA-256: el token plano se muestra una vez al generar.
            $table->string('token_hash', 64)->unique();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->index(['contract_id', 'revoked_at']);
        });

        Schema::table('contracts', function (Blueprint $table): void {
            $table->text('client_message')->nullable()->after('content_snapshot');
            $table->timestamp('client_responded_at')->nullable()->after('client_message');
        });
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table): void {
            $table->dropColumn(['client_message', 'client_responded_at']);
        });

        Schema::dropIfExists('contract_portal_links');
    }
};
