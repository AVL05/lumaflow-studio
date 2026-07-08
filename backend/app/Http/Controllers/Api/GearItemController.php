<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GearItemRequest;
use App\Http\Resources\GearItemResource;
use App\Models\GearItem;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class GearItemController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $sort = in_array(request('sort'), ['name', 'category', 'brand', 'purchase_date', 'created_at'], true) ? request('sort') : 'created_at';
        $direction = request('direction') === 'asc' ? 'asc' : 'desc';

        return GearItemResource::collection(
            GearItem::query()
                ->ownedBy(request()->user()->id)
                ->search(request('search'))
                ->category(request('category'))
                ->favorites(request('favorites'))
                ->orderBy($sort, $direction)
                ->paginate(min((int) request('per_page', 12), 48))
        );
    }

    public function store(GearItemRequest $request): GearItemResource
    {
        return new GearItemResource(request()->user()->gearItems()->create($request->validated()));
    }

    public function show(GearItem $gearItem): GearItemResource
    {
        $this->ensureOwnership($gearItem);

        return new GearItemResource($gearItem);
    }

    public function update(GearItemRequest $request, GearItem $gearItem): GearItemResource
    {
        $this->ensureOwnership($gearItem);
        $gearItem->update($request->validated());

        return new GearItemResource($gearItem->refresh());
    }

    public function destroy(GearItem $gearItem): mixed
    {
        $this->ensureOwnership($gearItem);
        $gearItem->delete();

        return response()->noContent();
    }

    private function ensureOwnership(GearItem $gearItem): void
    {
        abort_unless($gearItem->user_id === request()->user()->id, 404);
    }
}
