<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DeliveryRequest;
use App\Http\Resources\DeliveryResource;
use App\Models\Delivery;
use App\Models\Job;
use App\Services\DeliveryRevisionService;
use App\Services\WorkspaceAuthorizer;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DeliveryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $sort = in_array(request('sort'), ['title', 'status', 'delivery_date', 'created_at'], true) ? request('sort') : 'created_at';
        $direction = request('direction') === 'asc' ? 'asc' : 'desc';

        $deliveries = Delivery::query()
            ->accessibleBy(request()->user())
            ->with(['client', 'session'])
            ->search(request('search'))
            ->status(request('status'))
            ->when(request('client_id'), fn ($query) => $query->where('client_id', request('client_id')))
            ->orderBy($sort, $direction)
            ->paginate(min((int) request('per_page', 12), 48));

        return DeliveryResource::collection($deliveries);
    }

    public function store(DeliveryRequest $request, ?Job $job = null): DeliveryResource
    {
        $delivery = app(DeliveryRevisionService::class)->create($request->user(), $request->validated(), $job);

        return new DeliveryResource($delivery->load(['client', 'session']));
    }

    public function show(Delivery $delivery): DeliveryResource
    {
        $this->ensureOwnership($delivery);

        return new DeliveryResource($delivery->load(['client', 'session']));
    }

    public function update(DeliveryRequest $request, Delivery $delivery): DeliveryResource
    {
        $this->ensureOwnership($delivery);

        $delivery = app(DeliveryRevisionService::class)->update($delivery, $request->user(), $request->validated());

        return new DeliveryResource($delivery->load(['client', 'session']));
    }

    public function destroy(Delivery $delivery): mixed
    {
        $this->ensureOwnership($delivery);
        $delivery->delete();

        return response()->noContent();
    }

    private function ensureOwnership(Delivery $delivery): void
    {
        app(WorkspaceAuthorizer::class)->requireAccessOr404(request()->user(), $delivery);
    }
}
