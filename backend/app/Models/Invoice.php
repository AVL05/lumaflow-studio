<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'quote_id', 'client_id', 'session_id', 'invoice_number', 'status', 'issue_date', 'due_date', 'payment_date', 'subtotal', 'tax_rate', 'tax_amount', 'total', 'notes'])]
class Invoice extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'issue_date' => 'date', 'due_date' => 'date', 'payment_date' => 'date',
            'subtotal' => 'decimal:2', 'tax_rate' => 'decimal:2', 'tax_amount' => 'decimal:2', 'total' => 'decimal:2',
        ];
    }

    public function scopeOwnedBy($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }
}
