<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('presets', function (Blueprint $table): void {
            $table->text('description')->nullable()->after('name');
            $table->string('category')->default('color')->after('description');
            $table->integer('whites')->default(0)->after('highlights');
            $table->integer('blacks')->default(0)->after('whites');
            $table->integer('texture')->default(0)->after('clarity');
            $table->integer('intensity')->default(50)->after('texture');
            $table->integer('vibrance')->default(0)->after('saturation');
            $table->integer('tint')->default(0)->after('temperature');
            $table->integer('sharpness')->default(0)->after('tint');
            $table->integer('noise_reduction')->default(0)->after('sharpness');
            $table->integer('vignette')->default(0)->after('grain');
            $table->boolean('is_favorite')->default(false)->after('recommended_use');
            $table->string('color', 20)->default('#d6b17a')->after('is_favorite');
            $table->string('version', 20)->default('1.0')->after('color');
            $table->unsignedInteger('usage_count')->default(0)->after('version');
        });

        DB::statement("ALTER TABLE presets MODIFY style ENUM('cinematic','moody','urban','street','portrait','wedding','landscape','nature','automotive','product','editorial','documentary','travel','black_white','warm','cold','minimal','film','vintage','custom')");

        Schema::table('photos', function (Blueprint $table): void {
            $table->text('description')->nullable()->after('title');
        });

        Schema::create('albums', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('color', 20)->default('#d6b17a');
            $table->foreignId('cover_photo_id')->nullable()->constrained('photos')->nullOnDelete();
            $table->date('date')->nullable();
            $table->timestamps();
        });

        Schema::create('tags', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('color', 20)->default('#d6b17a');
            $table->timestamps();
            $table->unique(['user_id', 'slug']);
        });

        Schema::create('album_photo', function (Blueprint $table): void {
            $table->foreignId('album_id')->constrained()->cascadeOnDelete();
            $table->foreignId('photo_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['album_id', 'photo_id']);
        });

        Schema::create('photo_tag', function (Blueprint $table): void {
            $table->foreignId('photo_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['photo_id', 'tag_id']);
        });

        Schema::create('photo_comparisons', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('before_photo_id')->constrained('photos')->cascadeOnDelete();
            $table->foreignId('after_photo_id')->constrained('photos')->cascadeOnDelete();
            $table->string('title');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('photo_comparisons');
        Schema::dropIfExists('photo_tag');
        Schema::dropIfExists('album_photo');
        Schema::dropIfExists('tags');
        Schema::dropIfExists('albums');

        Schema::table('photos', function (Blueprint $table): void {
            $table->dropColumn('description');
        });

        DB::statement("ALTER TABLE presets MODIFY style ENUM('cinematic','urban','natural','moody','warm','cold')");

        Schema::table('presets', function (Blueprint $table): void {
            $table->dropColumn(['description', 'category', 'whites', 'blacks', 'texture', 'intensity', 'vibrance', 'tint', 'sharpness', 'noise_reduction', 'vignette', 'is_favorite', 'color', 'version', 'usage_count']);
        });
    }
};
