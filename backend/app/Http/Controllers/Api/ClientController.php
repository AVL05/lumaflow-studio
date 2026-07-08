<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ClientController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $sort = in_array(request('sort'), ['name', 'status', 'company', 'created_at'], true) ? request('sort') : 'created_at';
        $direction = request('direction') === 'asc' ? 'asc' : 'desc';

        $clients = Client::query()
            ->ownedBy(request()->user()->id)
            ->withCount('deliveries')
            ->search(request('search'))
            ->status(request('status'))
            ->orderBy($sort, $direction)
            ->paginate(min((int) request('per_page', 12), 48));

        return ClientResource::collection($clients);
    }

    public function store(ClientRequest $request): ClientResource
    {
        return new ClientResource(request()->user()->clients()->create($request->validated()));
    }

    public function show(Client $client): ClientResource
    {
        $this->ensureOwnership($client);

        return new ClientResource($client->loadCount('deliveries'));
    }

    public function update(ClientRequest $request, Client $client): ClientResource
    {
        $this->ensureOwnership($client);
        $client->update($request->validated());

        return new ClientResource($client->refresh()->loadCount('deliveries'));
    }

    public function destroy(Client $client): mixed
    {
        $this->ensureOwnership($client);
        $client->delete();

        return response()->noContent();
    }

    private function ensureOwnership(Client $client): void
    {
        abort_unless($client->user_id === request()->user()->id, 404);
    }
}
