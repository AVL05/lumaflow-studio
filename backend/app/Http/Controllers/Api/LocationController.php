<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LocationRequest;
use App\Http\Resources\LocationResource;
use App\Models\Location;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LocationController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $sort = in_array(request('sort'), ['name', 'city', 'country', 'type', 'created_at'], true) ? request('sort') : 'created_at';
        $direction = request('direction') === 'asc' ? 'asc' : 'desc';

        $locations = Location::query()
            ->ownedBy(request()->user()->id)
            ->with('coverPhoto')
            ->search(request('search'))
            ->city(request('city'))
            ->type(request('type'))
            ->difficulty(request('access_difficulty'))
            ->orderBy($sort, $direction)
            ->paginate(min((int) request('per_page', 12), 48));

        return LocationResource::collection($locations);
    }

    public function store(LocationRequest $request): LocationResource
    {
        $location = request()->user()->locations()->create($request->validated());

        return new LocationResource($location->load('coverPhoto'));
    }

    public function show(Location $location): LocationResource
    {
        $this->ensureOwnership($location);

        return new LocationResource($location->load('coverPhoto'));
    }

    public function update(LocationRequest $request, Location $location): LocationResource
    {
        $this->ensureOwnership($location);
        $location->update($request->validated());

        return new LocationResource($location->refresh()->load('coverPhoto'));
    }

    public function destroy(Location $location): mixed
    {
        $this->ensureOwnership($location);
        $location->delete();

        return response()->noContent();
    }

    private function ensureOwnership(Location $location): void
    {
        abort_unless($location->user_id === request()->user()->id, 404);
    }
}
