<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('delivery_images');

        Schema::table('deliveries', function (Blueprint $table): void {
            $table->string('gallery_provider', 50)->nullable()->after('gallery_url');
            $table->string('gallery_password', 255)->nullable()->after('gallery_provider');
            $table->date('gallery_expires_at')->nullable()->after('gallery_password');
        });

        // URLs externas (Drive, Dropbox, Pixieset...) superan 255 caracteres.
        // Sin doctrine/dbal no se puede usar change(): alteracion directa por driver.
        $driver = DB::getDriverName();
        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE `deliveries` MODIFY `gallery_url` VARCHAR(2048) NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE "deliveries" ALTER COLUMN "gallery_url" TYPE VARCHAR(2048)');
        }
        // SQLite ignora la longitud del VARCHAR, no necesita alteracion.
    }

    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table): void {
            $table->dropColumn(['gallery_provider', 'gallery_password', 'gallery_expires_at']);
        });
    }
};
