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

        Schema::create('presets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->enum('style', ['cinematic', 'urban', 'natural', 'moody', 'warm', 'cold']);
            $table->integer('contrast')->default(0);
            $table->integer('shadows')->default(0);
            $table->integer('highlights')->default(0);
            $table->integer('saturation')->default(0);
            $table->integer('temperature')->default(0);
            $table->integer('grain')->default(0);
            $table->integer('clarity')->default(0);
            $table->text('recommended_use')->nullable();
            $table->timestamps();
        });

        Schema::create('photos', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('session_id')->nullable()->constrained('sessions')->nullOnDelete();
            $table->string('title')->nullable();
            $table->string('file_path');
            $table->string('thumbnail_path')->nullable();
            $table->string('category')->nullable();
            $table->boolean('is_favorite')->default(false);
            $table->json('tags')->nullable();
            $table->json('exif')->nullable();
            $table->timestamps();
        });

        Schema::create('ai_analyses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('photo_id')->nullable()->constrained()->nullOnDelete();
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
        Schema::dropIfExists('photos');
        Schema::dropIfExists('presets');
        Schema::dropIfExists('gear_items');
        Schema::dropIfExists('sessions');
    }
};
