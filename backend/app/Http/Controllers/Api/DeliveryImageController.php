<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DeliveryImageResource;
use App\Models\Delivery;
use App\Models\DeliveryImage;
use App\Services\DeliveryGalleryService;
use Illuminate\Http\Request;

class DeliveryImageController extends Controller
{
    public function __construct(private readonly DeliveryGalleryService $gallery) {}

    public function store(Request $request, Delivery $delivery): mixed
    {
        $this->ensureOwnership($delivery);
        $request->validate([
            'images' => ['required', 'array', 'min:1', 'max:50'],
            'images.*' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:15360'],
        ]);

        return DeliveryImageResource::collection($this->gallery->upload($delivery, $request->file('images')))
            ->response()->setStatusCode(201);
    }

    public function destroy(Delivery $delivery, DeliveryImage $image): mixed
    {
        $this->ensureOwnership($delivery);
        abort_unless($image->delivery_id === $delivery->id, 404);
        $this->gallery->delete($image);

        return response()->noContent();
    }

    private function ensureOwnership(Delivery $delivery): void
    {
        abort_unless($delivery->user_id === request()->user()->id, 404);
    }
}
