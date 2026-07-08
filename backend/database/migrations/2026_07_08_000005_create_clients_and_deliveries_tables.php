<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('company')->nullable();
            $table->string('instagram')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['active', 'inactive', 'lead', 'archived'])->default('lead');
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        Schema::create('deliveries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('session_id')->nullable()->constrained('sessions')->nullOnDelete();
            $table->string('title');
            $table->enum('status', ['draft', 'pending', 'delivered', 'approved', 'archived'])->default('draft');
            $table->decimal('budget', 10, 2)->nullable();
            $table->date('delivery_date')->nullable();
            $table->string('gallery_url')->nullable();
            $table->text('private_notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'delivery_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deliveries');
        Schema::dropIfExists('clients');
    }
};
