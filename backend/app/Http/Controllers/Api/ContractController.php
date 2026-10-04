<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContractRequest;
use App\Http\Resources\ContractResource;
use App\Models\Contract;
use App\Services\ContractService;
use App\Services\WorkspaceAuthorizer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class ContractController extends Controller
{
    public function __construct(private readonly ContractService $contracts) {}

    public function index(): AnonymousResourceCollection
    {
        $sort = in_array(request('sort'), ['contract_number', 'title', 'status', 'created_at'], true) ? request('sort') : 'created_at';
        $direction = request('direction') === 'asc' ? 'asc' : 'desc';
        $contracts = Contract::query()->accessibleBy(request()->user())
            ->with(['client', 'job'])->search(request('search'))
            ->when(request('status'), fn ($query, $status) => $query->where('status', $status))
            ->when(request('job_id'), fn ($query, $jobId) => $query->where('job_id', $jobId))
            ->orderBy($sort, $direction)->paginate(min((int) request('per_page', 12), 48));

        return ContractResource::collection($contracts);
    }

    public function store(ContractRequest $request): ContractResource
    {
        return new ContractResource($this->contracts->create($request->user(), $request->validated()));
    }

    public function show(Contract $contract): ContractResource
    {
        $this->ensureOwnership($contract);

        return new ContractResource($contract->load(['client', 'job', 'quote']));
    }

    public function update(ContractRequest $request, Contract $contract): ContractResource
    {
        $this->ensureOwnership($contract);

        return new ContractResource($this->contracts->update($contract, $request->user(), $request->validated()));
    }

    public function updateStatus(Request $request, Contract $contract): ContractResource
    {
        $this->ensureOwnership($contract);
        $data = $request->validate(['status' => ['required', Rule::in(Contract::STATUSES)]]);

        return new ContractResource($this->contracts->transition($contract, $request->user(), $data['status']));
    }

    public function destroy(Contract $contract): mixed
    {
        $this->ensureOwnership($contract);
        abort_if($contract->getAttribute('status') !== Contract::STATUS_DRAFT,
            422, 'Solo un borrador puede eliminarse.');

        $contract->delete();

        return response()->noContent();
    }

    private function ensureOwnership(Contract $contract): void
    {
        app(WorkspaceAuthorizer::class)->requireAccessOr404(request()->user(), $contract);
    }
}
