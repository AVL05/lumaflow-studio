<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * Genera un feed iCalendar (RFC 5545) suscribible desde Google Calendar,
 * Apple Calendar u Outlook. Alternativa pragmatica a integrar la API de
 * Google Calendar (que exigiria OAuth y credenciales propias de la app).
 */
class IcsFeedService
{
    public function __construct(private readonly CalendarService $calendar) {}

    public function build(User $user): string
    {
        $from = now()->subDays(30)->toDateString();
        $to = now()->addDays(180)->toDateString();
        $events = $this->calendar->events($user, $from, $to);

        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//LumaFlow Studio//Calendar Feed//ES',
            'CALSCALE:GREGORIAN',
            'X-WR-CALNAME:LumaFlow Studio',
        ];

        foreach ($events as $event) {
            $lines = array_merge($lines, $this->toVevent($event));
        }

        $lines[] = 'END:VCALENDAR';

        return implode("\r\n", $lines)."\r\n";
    }

    private function toVevent(array $event): array
    {
        $date = Carbon::parse($event['date']);

        if ($event['time']) {
            [$hour, $minute] = explode(':', $event['time']);
            $start = $date->copy()->setTime((int) $hour, (int) $minute);
            $dtStart = 'DTSTART:'.$start->utc()->format('Ymd\THis\Z');
            $dtEnd = 'DTEND:'.$start->copy()->addHour()->utc()->format('Ymd\THis\Z');
        } else {
            $dtStart = 'DTSTART;VALUE=DATE:'.$date->format('Ymd');
            $dtEnd = 'DTEND;VALUE=DATE:'.$date->copy()->addDay()->format('Ymd');
        }

        return [
            'BEGIN:VEVENT',
            'UID:'.$event['id'].'@lumaflow-studio',
            'DTSTAMP:'.now()->utc()->format('Ymd\THis\Z'),
            $dtStart,
            $dtEnd,
            'SUMMARY:'.$this->escape($event['title']),
            'DESCRIPTION:'.$this->escape($this->describe($event)),
            'END:VEVENT',
        ];
    }

    private function describe(array $event): string
    {
        $labels = ['session' => 'Sesion', 'delivery' => 'Entrega', 'task' => 'Tarea'];
        $parts = array_filter([$labels[$event['source']] ?? $event['source'], $event['status'] ?? null]);

        return implode(' - ', $parts);
    }

    private function escape(string $value): string
    {
        return str_replace(['\\', ',', ';', "\n"], ['\\\\', '\\,', '\\;', '\\n'], $value);
    }
}
