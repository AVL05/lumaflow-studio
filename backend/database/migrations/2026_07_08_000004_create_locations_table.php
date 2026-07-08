<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->enum('type', ['urban', 'nature', 'studio', 'beach', 'mountain', 'forest', 'interior', 'industrial', 'street', 'architecture', 'automotive', 'other']);
            $table->string('best_time')->nullable();
            $table->enum('access_difficulty', ['easy', 'medium', 'hard'])->default('easy');
            $table->text('notes')->nullable();
            $table->json('tags')->nullable();
            $table->json('recommended_gear')->nullable();
            $table->foreignId('cover_photo_id')->nullable()->constrained('photos')->nullOnDelete();
            $table->timestamps();

            $table->index(['user_id', 'type']);
            $table->index(['user_id', 'city']);
            $table->index(['user_id', 'access_difficulty']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};
