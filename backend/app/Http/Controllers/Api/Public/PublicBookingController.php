<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\BookingRequestStoreRequest;
use App\Http\Resources\PublicStudioResource;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;

class PublicBookingController extends Controller
{
    public function __construct(private readonly NotificationService $notifications) {}

    public function show(string $slug): PublicStudioResource
    {
        $user = User::query()->where('studio_slug', $slug)->whereNotNull('bookings_enabled_at')->firstOrFail();

        return new PublicStudioResource($user);
    }

    public function store(BookingRequestStoreRequest $request, string $slug): JsonResponse
    {
        $user = User::query()->where('studio_slug', $slug)->whereNotNull('bookings_enabled_at')->firstOrFail();

        $booking = $user->bookingRequests()->create($request->validated() + ['status' => 'new']);

        $this->notifications->info(
            $user,
            'Nueva solicitud de reserva',
            "{$booking->name} - ".($booking->session_type ?? 'sesion sin especificar'),
            '/app/booking-requests',
        );

        return response()->json(['message' => 'Solicitud enviada. El estudio te respondera pronto.'], 201);
    }
}
