<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['delivery_id', 'number', 'gallery_url', 'gallery_provider', 'gallery_password', 'delivery_date', 'notes', 'legacy_client_message', 'legacy_responded_at', 'created_by', 'author_name', 'request_id', 'payload_hash', 'legacy', 'published'])]
class DeliveryRevision extends Model
{
    protected function casts(): array
    {
        return ['number' => 'integer', 'legacy' => 'boolean', 'published' => 'boolean', 'delivery_date' => 'date', 'legacy_responded_at' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new \LogicException('Delivery revision content is immutable.'));
    }
}
