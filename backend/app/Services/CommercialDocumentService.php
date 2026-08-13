<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Quote;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CommercialDocumentService
{
    public function createQuote(User $user, array $data): Quote
    {
        return DB::transaction(function () use ($user, $data): Quote {
            $totals = $this->totals($data['items'], (float) $data['tax_rate']);
            $quote = $user->quotes()->create([
                'job_id' => $data['job_id'] ?? null,
                'client_id' => $data['client_id'],
                'session_id' => $data['session_id'] ?? null,
                'quote_number' => $this->nextNumber(Quote::class, 'quote_number', 'PRE', $user->id),
                'status' => 'draft',
                'issue_date' => $data['issue_date'] ?? now()->toDateString(),
                'valid_until' => $data['valid_until'] ?? null,
                'tax_rate' => $data['tax_rate'],
                'notes' => $data['notes'] ?? null,
                ...$totals,
            ]);
            $this->replaceItems($quote, $data['items']);

            return $quote->load(['client', 'session', 'items', 'invoice']);
        });
    }

    public function updateQuote(Quote $quote, array $data): Quote
    {
        if ($quote->invoice()->exists()) {
            throw ValidationException::withMessages(['quote' => 'No se puede editar un presupuesto ya facturado.']);
        }

        return DB::transaction(function () use ($quote, $data): Quote {
            $totals = $this->totals($data['items'], (float) $data['tax_rate']);
            $quote->update([
                'job_id' => $data['job_id'] ?? null,
                'client_id' => $data['client_id'],
                'session_id' => $data['session_id'] ?? null,
                'issue_date' => $data['issue_date'] ?? $quote->issue_date,
                'valid_until' => $data['valid_until'] ?? null,
                'tax_rate' => $data['tax_rate'],
                'notes' => $data['notes'] ?? null,
                ...$totals,
            ]);
            $this->replaceItems($quote, $data['items']);

            return $quote->refresh()->load(['client', 'session', 'items', 'invoice']);
        });
    }

    public function createInvoice(User $user, Quote $quote, array $data): Invoice
    {
        if ($quote->status !== 'accepted') {
            throw ValidationException::withMessages(['quote_id' => 'Acepta el presupuesto antes de facturarlo.']);
        }
        if ($quote->invoice()->exists()) {
            throw ValidationException::withMessages(['quote_id' => 'Este presupuesto ya tiene factura.']);
        }

        return DB::transaction(fn () => $user->invoices()->create([
            'job_id' => $quote->job_id,
            'quote_id' => $quote->id,
            'client_id' => $quote->client_id,
            'session_id' => $quote->session_id,
            'invoice_number' => $this->nextNumber(Invoice::class, 'invoice_number', 'FAC', $user->id),
            'status' => 'draft',
            'issue_date' => $data['issue_date'] ?? now()->toDateString(),
            'due_date' => $data['due_date'] ?? now()->addDays(30)->toDateString(),
            'subtotal' => $quote->subtotal,
            'tax_rate' => $quote->tax_rate,
            'tax_amount' => $quote->tax_amount,
            'total' => $quote->total,
            'notes' => $data['notes'] ?? $quote->notes,
        ])->load(['client', 'session']));
    }

    public function quotePdf(Quote $quote): mixed
    {
        return Pdf::loadView('pdf.quote', ['quote' => $quote->load(['client', 'session', 'items', 'user'])])
            ->download("presupuesto-{$quote->quote_number}.pdf");
    }

    public function invoicePdf(Invoice $invoice): mixed
    {
        return Pdf::loadView('pdf.invoice', ['invoice' => $invoice->load(['client', 'session', 'quote.items', 'user'])])
            ->download("factura-{$invoice->invoice_number}.pdf");
    }

    private function totals(array $items, float $taxRate): array
    {
        $subtotal = round(collect($items)->sum(fn ($item) => (float) $item['quantity'] * (float) $item['unit_price']), 2);
        $taxAmount = round($subtotal * $taxRate / 100, 2);

        return ['subtotal' => $subtotal, 'tax_amount' => $taxAmount, 'total' => $subtotal + $taxAmount];
    }

    private function replaceItems(Quote $quote, array $items): void
    {
        $quote->items()->delete();
        foreach ($items as $position => $item) {
            $quote->items()->create([
                ...$item,
                'subtotal' => round((float) $item['quantity'] * (float) $item['unit_price'], 2),
                'position' => $position,
            ]);
        }
    }

    /** @param class-string<Model> $model */
    private function nextNumber(string $model, string $column, string $prefix, int $userId): string
    {
        $year = now()->year;
        $last = $model::query()->where('user_id', $userId)->where($column, 'like', "{$prefix}-{$year}-%")
            ->lockForUpdate()->orderByDesc('id')->value($column);
        $sequence = $last ? ((int) str($last)->afterLast('-')->toString()) + 1 : 1;

        return sprintf('%s-%d-%04d', $prefix, $year, $sequence);
    }
}
