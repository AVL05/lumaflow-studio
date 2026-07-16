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
        $presets = Preset::query()->ownedBy(request()->user()->id)->with('gearItem')
            ->when(request('category'), fn ($query, $category) => $query->where('category', $category))
            ->when(request('search'), fn ($query, $search) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('category')->orderBy('name')->paginate(min((int) request('per_page', 24), 100));

        return PresetResource::collection($presets);
    }

    public function store(PresetRequest $request): PresetResource
    {
        return new PresetResource($request->user()->presets()->create($request->validated())->load('gearItem'));
    }

    public function update(PresetRequest $request, Preset $preset): PresetResource
    {
        $this->ensureOwnership($preset);
        $preset->update($request->validated());

        return new PresetResource($preset->refresh()->load('gearItem'));
    }

    public function destroy(Preset $preset): mixed
    {
        $this->ensureOwnership($preset);
        $preset->delete();

        return response()->noContent();
    }

    private function ensureOwnership(Preset $preset): void
    {
        abort_unless($preset->user_id === request()->user()->id, 404);
    }
}
