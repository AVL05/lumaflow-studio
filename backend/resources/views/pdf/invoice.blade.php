<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Factura {{ $invoice->invoice_number }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #292524; font-size: 12px; }
        h1 { margin: 0; font-size: 26px; } .muted { color: #78716c; }
        .header { border-bottom: 2px solid #d6a85f; padding-bottom: 18px; margin-bottom: 24px; }
        .grid { width: 100%; margin-bottom: 24px; } .grid td { width: 50%; vertical-align: top; }
        table.items { width: 100%; border-collapse: collapse; }
        .items th { text-align: left; background: #1c1917; color: white; padding: 9px; }
        .items td { padding: 9px; border-bottom: 1px solid #e7e5e4; }
        .right { text-align: right; } .totals { width: 42%; margin-left: auto; margin-top: 18px; }
        .totals td { padding: 5px 0; } .total { font-size: 16px; font-weight: bold; color: #92400e; }
        .notes { margin-top: 28px; padding: 14px; background: #fafaf9; }
    </style>
</head>
<body>
    <div class="header"><h1>Factura</h1><div class="muted">{{ $invoice->invoice_number }} · LumaFlow Studio</div></div>
    <table class="grid"><tr>
        <td><strong>{{ $invoice->user->name }}</strong><br>{{ $invoice->user->email }}</td>
        <td><strong>Cliente</strong><br>{{ $invoice->client->name }}<br>{{ $invoice->client->email }}</td>
    </tr></table>
    <p>Emisión: {{ $invoice->issue_date->format('d/m/Y') }} @if($invoice->due_date) · Vencimiento: {{ $invoice->due_date->format('d/m/Y') }} @endif</p>
    <table class="items"><thead><tr><th>Concepto</th><th class="right">Cantidad</th><th class="right">Precio</th><th class="right">Importe</th></tr></thead><tbody>
    @foreach($invoice->quote->items as $item)
        <tr><td>{{ $item->description }}</td><td class="right">{{ number_format($item->quantity, 2, ',', '.') }}</td><td class="right">{{ number_format($item->unit_price, 2, ',', '.') }} €</td><td class="right">{{ number_format($item->subtotal, 2, ',', '.') }} €</td></tr>
    @endforeach
    </tbody></table>
    <table class="totals">
        <tr><td>Subtotal</td><td class="right">{{ number_format($invoice->subtotal, 2, ',', '.') }} €</td></tr>
        <tr><td>IVA ({{ number_format($invoice->tax_rate, 2, ',', '.') }}%)</td><td class="right">{{ number_format($invoice->tax_amount, 2, ',', '.') }} €</td></tr>
        <tr class="total"><td>Total</td><td class="right">{{ number_format($invoice->total, 2, ',', '.') }} €</td></tr>
    </table>
    @if($invoice->notes)<div class="notes"><strong>Notas</strong><br>{{ $invoice->notes }}</div>@endif
</body>
</html>
