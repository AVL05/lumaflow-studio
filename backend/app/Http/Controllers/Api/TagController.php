<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TagRequest;
use App\Http\Resources\TagResource;
use App\Models\Tag;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TagController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $tags = Tag::query()
            ->ownedBy(request()->user()->id)
            ->withCount('photos')
            ->when(request('search'), fn ($query) => $query->where('name', 'like', '%'.request('search').'%'))
            ->orderBy('name')
            ->paginate(min((int) request('per_page', 100), 200));

        return TagResource::collection($tags);
    }

    public function store(TagRequest $request): TagResource
    {
        return new TagResource(request()->user()->tags()->create($request->validated()));
    }

    public function update(TagRequest $request, Tag $tag): TagResource
    {
        $this->ensureOwnership($tag);
        $tag->update($request->validated());

        return new TagResource($tag->refresh());
    }

    public function destroy(Tag $tag): mixed
    {
        $this->ensureOwnership($tag);
        $tag->delete();

        return response()->noContent();
    }

    private function ensureOwnership(Tag $tag): void
    {
        abort_unless($tag->user_id === request()->user()->id, 404);
    }
}
