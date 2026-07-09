<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookingRequestResource;
use App\Http\Resources\ClientResource;
use App\Models\BookingRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class BookingRequestController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $bookings = BookingRequest::query()
            ->ownedBy(request()->user()->id)
            ->status(request('status'))
            ->latest()
            ->paginate(min((int) request('per_page', 20), 50));

        return BookingRequestResource::collection($bookings);
    }

    public function update(BookingRequest $bookingRequest): BookingRequestResource
    {
        $this->ensureOwnership($bookingRequest);

        $status = request()->validate([
            'status' => ['required', Rule::in(['new', 'contacted', 'converted', 'archived'])],
        ])['status'];

        $bookingRequest->update(['status' => $status]);

        return new BookingRequestResource($bookingRequest->fresh());
    }

    /** Convierte la solicitud en un cliente real (lead) de un solo clic. */
    public function convert(BookingRequest $bookingRequest): JsonResponse
    {
        $this->ensureOwnership($bookingRequest);

        $client = request()->user()->clients()->create([
            'name' => $bookingRequest->name,
            'email' => $bookingRequest->email,
            'phone' => $bookingRequest->phone,
            'notes' => $bookingRequest->message,
            'status' => 'lead',
        ]);

        $bookingRequest->update(['status' => 'converted']);

        return (new ClientResource($client))->response()->setStatusCode(201);
    }

    public function destroy(BookingRequest $bookingRequest): mixed
    {
        $this->ensureOwnership($bookingRequest);
        $bookingRequest->delete();

        return response()->noContent();
    }

    private function ensureOwnership(BookingRequest $bookingRequest): void
    {
        abort_unless($bookingRequest->user_id === request()->user()->id, 404);
    }
}
