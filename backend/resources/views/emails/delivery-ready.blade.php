<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="utf-8">
    <title>{{ $delivery->title }}</title>
</head>

<body style="margin:0;padding:32px 16px;background:#0b0a09;font-family:Arial,Helvetica,sans-serif;color:#e7e5e4;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;">
        <tr>
            <td style="padding-bottom:24px;">
                <span style="display:inline-block;background:#f5d38d;color:#1c1917;font-weight:bold;font-size:14px;padding:8px 12px;border-radius:8px;">{{ $studioName }}</span>
            </td>
        </tr>
        <tr>
            <td style="font-size:22px;font-weight:600;padding-bottom:12px;color:#fafaf9;">
                Hola {{ $clientName }}, tu galeria ya esta lista
            </td>
        </tr>
        <tr>
            <td style="font-size:14px;line-height:22px;color:#a8a29e;padding-bottom:24px;">
                La entrega <strong style="color:#e7e5e4;">{{ $delivery->title }}</strong> ha sido marcada como lista por {{ $studioName }}. Puedes revisarla, ver el estado del pago y aprobarla desde tu portal privado.
            </td>
        </tr>
        <tr>
            <td style="padding-bottom:24px;">
                <a href="{{ $portalUrl }}" style="display:inline-block;background:#f5d38d;color:#1c1917;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px;text-decoration:none;">
                    Ver mi galeria
                </a>
            </td>
        </tr>
        @if($delivery->gallery_url)
        <tr>
            <td style="font-size:13px;color:#78716c;padding-bottom:8px;">
                Enlace directo a la galeria: <a href="{{ $delivery->gallery_url }}" style="color:#f5d38d;">{{ $delivery->gallery_url }}</a>
            </td>
        </tr>
        @endif
        <tr>
            <td style="font-size:12px;color:#57534e;padding-top:24px;border-top:1px solid #292524;">
                Este correo lo envia LumaFlow Studio en nombre de {{ $studioName }}.
            </td>
        </tr>
    </table>
</body>

</html>
