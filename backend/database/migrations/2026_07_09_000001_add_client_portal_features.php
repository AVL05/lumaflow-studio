<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('studio_slug')->nullable()->unique()->after('email');
            $table->string('calendar_token', 40)->nullable()->unique()->after('studio_slug');
        });

        Schema::table('deliveries', function (Blueprint $table): void {
            $table->string('public_token', 40)->nullable()->unique()->after('id');
            $table->enum('payment_status', ['pending', 'partial', 'paid'])->default('pending')->after('budget');
            $table->decimal('amount_paid', 10, 2)->default(0)->after('payment_status');
            $table->text('client_message')->nullable()->after('private_notes');
            $table->timestamp('client_responded_at')->nullable()->after('client_message');
        });

        Schema::create('booking_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('session_type')->nullable();
            $table->date('preferred_date')->nullable();
            $table->text('message')->nullable();
            $table->enum('status', ['new', 'contacted', 'converted', 'archived'])->default('new');
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        // Backfill de filas existentes: los hooks de modelo solo generan
        // slug/token en registros nuevos.
        DB::table('users')->whereNull('studio_slug')->orWhereNull('calendar_token')->orderBy('id')->get()->each(function ($user): void {
            DB::table('users')->where('id', $user->id)->update([
                'studio_slug' => Str::slug($user->name) !== '' ? Str::slug($user->name).'-'.$user->id : 'studio-'.$user->id,
                'calendar_token' => Str::random(40),
            ]);
        });

        DB::table('deliveries')->whereNull('public_token')->orderBy('id')->get()->each(function ($delivery): void {
            DB::table('deliveries')->where('id', $delivery->id)->update([
                'public_token' => Str::random(40),
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_requests');

        Schema::table('deliveries', function (Blueprint $table): void {
            $table->dropColumn(['public_token', 'payment_status', 'amount_paid', 'client_message', 'client_responded_at']);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['studio_slug', 'calendar_token']);
        });
    }
};
