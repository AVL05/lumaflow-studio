<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sessions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->date('date');
            $table->string('location_name')->nullable();
            $table->string('session_type');
            $table->enum('status', ['planned', 'completed', 'editing', 'delivered'])->default('planned');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('gear_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->enum('category', ['camera', 'lens', 'filter', 'tripod', 'light', 'gopro', 'mobile', 'accessory', 'battery', 'sd_card']);
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_favorite')->default(false);
            $table->timestamps();
        });

        Schema::create('ai_analyses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->text('prompt');
            $table->json('result')->nullable();
            $table->text('summary')->nullable();
            $table->decimal('score', 5, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_analyses');
        Schema::dropIfExists('gear_items');
        Schema::dropIfExists('sessions');
    }
};
