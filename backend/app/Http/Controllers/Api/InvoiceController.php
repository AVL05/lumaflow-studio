<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Models\Quote;
use App\Services\CommercialDocumentService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class InvoiceController extends Controller
{
    public function __construct(private readonly CommercialDocumentService $documents) {}

    public function index(): AnonymousResourceCollection
    {
        Invoice::query()->ownedBy(request()->user()->id)->whereIn('status', ['draft', 'sent'])
            ->whereNotNull('due_date')->where('due_date', '<', now()->toDateString())->update(['status' => 'overdue']);
        $invoices = Invoice::query()->ownedBy(request()->user()->id)->with(['client', 'session'])
            ->when(request('status'), fn ($query, $status) => $query->where('status', $status))
            ->orderByDesc('issue_date')->paginate(min((int) request('per_page', 12), 48));

        return InvoiceResource::collection($invoices);
    }

    public function store(Request $request): InvoiceResource
    {
        $data = $request->validate([
            'quote_id' => ['required', Rule::exists('quotes', 'id')->where('user_id', $request->user()->id)],
            'issue_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:issue_date'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);
        $quote = Quote::query()->ownedBy($request->user()->id)->findOrFail($data['quote_id']);

        return new InvoiceResource($this->documents->createInvoice($request->user(), $quote, $data));
    }

    public function show(Invoice $invoice): InvoiceResource
    {
        $this->ensureOwnership($invoice);

        return new InvoiceResource($invoice->load(['client', 'session']));
    }

    public function updateStatus(Request $request, Invoice $invoice): InvoiceResource
    {
        $this->ensureOwnership($invoice);
        $data = $request->validate(['status' => ['required', Rule::in(['draft', 'sent', 'paid', 'overdue', 'cancelled'])]]);
        $data['payment_date'] = $data['status'] === 'paid' ? now()->toDateString() : null;
        $invoice->update($data);

        return new InvoiceResource($invoice->refresh()->load(['client', 'session']));
    }

    public function pdf(Invoice $invoice): mixed
    {
        $this->ensureOwnership($invoice);

        return $this->documents->invoicePdf($invoice);
    }

    private function ensureOwnership(Invoice $invoice): void
    {
        abort_unless($invoice->user_id === request()->user()->id, 404);
    }
}
