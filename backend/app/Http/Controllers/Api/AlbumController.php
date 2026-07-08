<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AlbumRequest;
use App\Http\Resources\AlbumResource;
use App\Models\Album;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AlbumController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $albums = Album::query()
            ->ownedBy(request()->user()->id)
            ->with('coverPhoto')
            ->withCount('photos')
            ->search(request('search'))
            ->latest()
            ->paginate(min((int) request('per_page', 12), 48));

        return AlbumResource::collection($albums);
    }

    public function store(AlbumRequest $request): AlbumResource
    {
        $album = request()->user()->albums()->create($request->safe()->except('photo_ids'));
        $album->photos()->sync($request->input('photo_ids', []));

        return new AlbumResource($album->load('coverPhoto')->loadCount('photos'));
    }

    public function show(Album $album): AlbumResource
    {
        $this->ensureOwnership($album);

        return new AlbumResource($album->load('coverPhoto')->loadCount('photos'));
    }

    public function update(AlbumRequest $request, Album $album): AlbumResource
    {
        $this->ensureOwnership($album);
        $album->update($request->safe()->except('photo_ids'));
        $album->photos()->sync($request->input('photo_ids', []));

        return new AlbumResource($album->refresh()->load('coverPhoto')->loadCount('photos'));
    }

    public function destroy(Album $album): mixed
    {
        $this->ensureOwnership($album);
        $album->delete();

        return response()->noContent();
    }

    private function ensureOwnership(Album $album): void
    {
        abort_unless($album->user_id === request()->user()->id, 404);
    }
}
