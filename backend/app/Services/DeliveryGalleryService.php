<?php

namespace App\Services;

use App\Models\Delivery;
use App\Models\DeliveryImage;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DeliveryGalleryService
{
    public function upload(Delivery $delivery, array $files): Collection
    {
        $images = collect();
        $position = (int) ($delivery->images()->max('position') ?? 0);

        foreach ($files as $file) {
            $path = $file->storeAs("deliveries/{$delivery->id}", Str::uuid().'.'.$file->extension(), 'public');
            $images->push($delivery->images()->create([
                'user_id' => $delivery->user_id,
                'filename' => $file->getClientOriginalName(),
                'path' => $path,
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'position' => ++$position,
            ]));
        }

        return $images;
    }

    public function delete(DeliveryImage $image): void
    {
        Storage::disk('public')->delete($image->path);
        $image->delete();
    }
}
