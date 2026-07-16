<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuoteRequest;
use App\Http\Resources\QuoteResource;
use App\Models\Quote;
use App\Services\CommercialDocumentService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class QuoteController extends Controller
{
    public function __construct(private readonly CommercialDocumentService $documents) {}

    public function index(): AnonymousResourceCollection
    {
        $sort = in_array(request('sort'), ['issue_date', 'valid_until', 'total', 'status', 'created_at'], true) ? request('sort') : 'created_at';
        $direction = request('direction') === 'asc' ? 'asc' : 'desc';
        $quotes = Quote::query()->ownedBy(request()->user()->id)
            ->with(['client', 'session', 'items', 'invoice'])->search(request('search'))
            ->when(request('status'), fn ($query, $status) => $query->where('status', $status))
            ->orderBy($sort, $direction)->paginate(min((int) request('per_page', 12), 48));

        return QuoteResource::collection($quotes);
    }

    public function store(QuoteRequest $request): QuoteResource
    {
        return new QuoteResource($this->documents->createQuote($request->user(), $request->validated()));
    }

    public function show(Quote $quote): QuoteResource
    {
        $this->ensureOwnership($quote);

        return new QuoteResource($quote->load(['client', 'session', 'items', 'invoice']));
    }

    public function update(QuoteRequest $request, Quote $quote): QuoteResource
    {
        $this->ensureOwnership($quote);

        return new QuoteResource($this->documents->updateQuote($quote, $request->validated()));
    }

    public function updateStatus(Request $request, Quote $quote): QuoteResource
    {
        $this->ensureOwnership($quote);
        $data = $request->validate(['status' => ['required', Rule::in(['draft', 'sent', 'accepted', 'rejected', 'expired'])]]);
        $quote->update($data);

        return new QuoteResource($quote->refresh()->load(['client', 'session', 'items', 'invoice']));
    }

    public function destroy(Quote $quote): mixed
    {
        $this->ensureOwnership($quote);
        abort_if($quote->invoice()->exists(), 422, 'No se puede eliminar un presupuesto facturado.');
        $quote->delete();

        return response()->noContent();
    }

    public function pdf(Quote $quote): mixed
    {
        $this->ensureOwnership($quote);

        return $this->documents->quotePdf($quote);
    }

    private function ensureOwnership(Quote $quote): void
    {
        abort_unless($quote->user_id === request()->user()->id, 404);
    }
}
