<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Plan de producción</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #292524; }
        h1 { font-size: 21px; } h2 { font-size: 15px; margin-top: 24px; }
        .shot { border-top: 1px solid #a8a29e; padding: 10px 0; page-break-inside: avoid; }
        .text { white-space: pre-wrap; word-wrap: break-word; }
        .muted { color: #57534e; } .day { border-bottom: 2px solid #d6a85f; padding-bottom: 12px; }
    </style>
</head>
<body>
    <h1>{{ $job->title }}</h1>
    <p>Plan de producción · LumaFlow Studio · Horas locales del proyecto</p>
    <p class="text">{{ $job->briefing['objectives'] ?? $job->description }}</p>
    @foreach($days as $day)
        <div class="day">
            <h2>{{ $day->name }} · {{ $day->date?->format('d/m/Y') }}</h2>
            <p>{{ substr($day->time ?? '', 0, 5) }} — {{ substr($day->end_time ?? '', 0, 5) }} · {{ $day->location?->name ?? $day->location_name }}</p>
            <p>{{ $day->location?->city }} {{ $day->location?->country }}</p>
            <p>Participantes: {{ collect($day->participants ?? [])->map(fn ($person) => $person['name'].(!empty($person['role']) ? ' ('.$person['role'].')' : ''))->implode(', ') }}</p>
            <p class="text">Notas: {{ $day->notes }}</p>
            <p class="text">Incidencias: {{ $day->incidents }}</p>
            @foreach($day->checklists as $checklist)
                <p><strong>{{ $checklist->name }}</strong></p>
                @foreach($checklist->items as $item)
                    <p>{{ $item->is_completed ? '[x]' : '[ ]' }} {{ $item->title }}</p>
                @endforeach
            @endforeach
        </div>
    @endforeach
    <h2>{{ $job->project_type === 'photography' ? 'Fotografías previstas' : 'Lista de tomas' }}</h2>
    @forelse($shots as $shot)
        <div class="shot">
            <strong>#{{ $shot->id }} @if($shot->scene) · {{ $shot->scene }} @endif · {{ ['pending'=>'Pendiente','ready'=>'Preparada','done'=>'Realizada','discarded'=>'Descartada'][$shot->status] ?? $shot->status }}</strong>
            <p class="text">{{ $shot->description }}</p>
            <p>{{ $shot->shot_type }} · {{ $shot->camera_movement }} · {{ $shot->focal_length }} @if($shot->estimated_seconds) · {{ $shot->estimated_seconds }} s @endif</p>
            <p>Jornada: {{ $days->firstWhere('id', $shot->session_id)?->name ?? 'Sin asignar' }} · {{ substr($shot->scheduled_time ?? '', 0, 5) }} · {{ $shot->location?->name }}</p>
            <p>Equipo: {{ $shot->gearItems->pluck('name')->implode(', ') }}</p>
            <p class="text">Notas: {{ $shot->notes }}</p>
        </div>
    @empty
        <p>No hay tomas en esta selección.</p>
    @endforelse
</body>
</html>
