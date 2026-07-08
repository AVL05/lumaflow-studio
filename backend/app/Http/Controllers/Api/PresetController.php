<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PresetRequest;
use App\Http\Resources\PresetResource;
use App\Models\Preset;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PresetController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $sort = in_array(request('sort'), ['name', 'category', 'style', 'usage_count', 'created_at'], true) ? request('sort') : 'created_at';
        $direction = request('direction') === 'asc' ? 'asc' : 'desc';

        return PresetResource::collection(
            Preset::query()
                ->ownedBy(request()->user()->id)
                ->search(request('search'))
                ->category(request('category'))
                ->style(request('style'))
                ->favorites(request('favorites'))
                ->orderBy($sort, $direction)
                ->paginate(min((int) request('per_page', 12), 48))
        );
    }

    public function store(PresetRequest $request): PresetResource
    {
        return new PresetResource(request()->user()->presets()->create($request->validated()));
    }

    public function show(Preset $preset): PresetResource
    {
        $this->ensureOwnership($preset);

        return new PresetResource($preset);
    }

    public function update(PresetRequest $request, Preset $preset): PresetResource
    {
        $this->ensureOwnership($preset);
        $preset->update($request->validated());

        return new PresetResource($preset->refresh());
    }

    public function destroy(Preset $preset): mixed
    {
        $this->ensureOwnership($preset);
        $preset->delete();

        return response()->noContent();
    }

    public function duplicate(Preset $preset): PresetResource
    {
        $this->ensureOwnership($preset);

        $copy = $preset->replicate();
        $copy->name = $preset->name.' Copy';
        $copy->version = $this->nextVersion($preset->version);
        $copy->is_favorite = false;
        $copy->usage_count = 0;
        $copy->save();

        return new PresetResource($copy);
    }

    private function ensureOwnership(Preset $preset): void
    {
        abort_unless($preset->user_id === request()->user()->id, 404);
    }

    private function nextVersion(?string $version): string
    {
        $number = is_numeric($version) ? (float) $version : 1.0;

        return number_format($number + 0.1, 1);
    }
}
