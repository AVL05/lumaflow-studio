<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('locations', function (Blueprint $table): void {
            $table->unsignedTinyInteger('rating')->nullable()->after('access_difficulty');
            $table->boolean('is_favorite')->default(false)->after('rating');
            $table->enum('access_mode', ['car', 'walking', 'public_transport', 'mixed'])->nullable()->after('is_favorite');
            $table->text('permissions_required')->nullable()->after('access_mode');
            $table->decimal('cost', 10, 2)->nullable()->after('permissions_required');
            $table->string('google_maps_url')->nullable()->after('cost');
            $table->string('apple_maps_url')->nullable()->after('google_maps_url');
            $table->string('openstreetmap_url')->nullable()->after('apple_maps_url');
            $table->string('recommended_weather')->nullable()->after('openstreetmap_url');
            $table->json('recommended_seasons')->nullable()->after('recommended_weather');

            $table->index(['user_id', 'is_favorite']);
            $table->index(['user_id', 'rating']);
        });

        Schema::table('sessions', function (Blueprint $table): void {
            $table->foreignId('location_id')->nullable()->after('user_id')->constrained('locations')->nullOnDelete();
            $table->index(['user_id', 'location_id']);
        });
    }

    public function down(): void
    {
        Schema::table('sessions', function (Blueprint $table): void {
            $table->dropIndex(['user_id', 'location_id']);
            $table->dropConstrainedForeignId('location_id');
        });

        Schema::table('locations', function (Blueprint $table): void {
            $table->dropIndex(['user_id', 'is_favorite']);
            $table->dropIndex(['user_id', 'rating']);
            $table->dropColumn([
                'rating',
                'is_favorite',
                'access_mode',
                'permissions_required',
                'cost',
                'google_maps_url',
                'apple_maps_url',
                'openstreetmap_url',
                'recommended_weather',
                'recommended_seasons',
            ]);
        });
    }
};
