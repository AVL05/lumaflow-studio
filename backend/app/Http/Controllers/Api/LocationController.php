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
        $sort = in_array(request('sort'), ['name', 'city', 'country', 'type', 'rating', 'created_at'], true) ? request('sort') : 'created_at';
        $direction = request('direction') === 'asc' ? 'asc' : 'desc';
        $latitude = request()->filled('latitude') ? (float) request('latitude') : null;
        $longitude = request()->filled('longitude') ? (float) request('longitude') : null;
        $radius = request()->filled('radius_km') ? (float) request('radius_km') : null;

        $locations = Location::query()
            ->ownedBy(request()->user()->id)
            ->with('coverPhoto')
            ->withCount(['photos', 'sessions'])
            ->search(request('search'))
            ->city(request('city'))
            ->type(request('type'))
            ->difficulty(request('access_difficulty'))
            ->favorite(request('favorite'))
            ->accessMode(request('access_mode'))
            ->near($latitude, $longitude, $radius)
            ->when($latitude !== null && $longitude !== null, fn ($query) => $query->orderBy('distance_km'))
            ->when($latitude === null || $longitude === null, fn ($query) => $query->orderBy($sort, $direction))
            ->paginate(min((int) request('per_page', 12), 48));

        return LocationResource::collection($locations);
    }

    public function store(LocationRequest $request): LocationResource
    {
        $location = request()->user()->locations()->create($request->locationAttributes());
        $location->photos()->sync($request->photoIds());

        return new LocationResource($location->load(['coverPhoto', 'photos'])->loadCount(['photos', 'sessions']));
    }

    public function show(Location $location): LocationResource
    {
        $this->ensureOwnership($location);

        return new LocationResource($location->load(['coverPhoto', 'photos', 'sessions'])->loadCount(['photos', 'sessions']));
    }

    public function update(LocationRequest $request, Location $location): LocationResource
    {
        $this->ensureOwnership($location);
        $location->update($request->locationAttributes());
        $location->photos()->sync($request->photoIds());

        return new LocationResource($location->refresh()->load(['coverPhoto', 'photos'])->loadCount(['photos', 'sessions']));
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
