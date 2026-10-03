<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * La numeracion comercial pasa a ser por workspace (varios miembros
     * pueden facturar en el mismo estudio). `user_id` se conserva.
     */
    public function up(): void
    {
        Schema::table('quotes', function (Blueprint $table): void {
            $table->unique(['workspace_id', 'quote_number'], 'quotes_workspace_number_unique');
        });

        Schema::table('invoices', function (Blueprint $table): void {
            $table->unique(['workspace_id', 'invoice_number'], 'invoices_workspace_number_unique');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table): void {
            $table->dropUnique('invoices_workspace_number_unique');
        });

        Schema::table('quotes', function (Blueprint $table): void {
            $table->dropUnique('quotes_workspace_number_unique');
        });
    }
};
