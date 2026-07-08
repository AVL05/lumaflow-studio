<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Delivery;
use App\Models\GearItem;
use App\Models\Location;
use App\Models\Photo;
use App\Models\Preset;
use App\Models\Session;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Infraestructura de exportacion. CSV y JSON operativos; PDF queda preparado
 * en el contrato (formato rechazado en validacion) para una fase posterior.
 */
class ExportService
{
    public const FORMATS = ['csv', 'json'];

    private const COLUMNS = [
        'sessions' => ['id', 'name', 'date', 'time', 'session_type', 'status', 'client_name', 'location_name'],
        'clients' => ['id', 'name', 'email', 'phone', 'company', 'instagram', 'status'],
        'deliveries' => ['id', 'title', 'status', 'budget', 'delivery_date', 'gallery_url'],
        'tasks' => ['id', 'title', 'priority', 'status', 'due_date', 'due_time', 'completed_at'],
        'photos' => ['id', 'title', 'file_name', 'category', 'is_favorite', 'taken_at'],
        'gear' => ['id', 'name', 'category', 'brand', 'model', 'condition', 'is_favorite'],
        'presets' => ['id', 'name', 'category', 'style', 'usage_count', 'version'],
        'locations' => ['id', 'name', 'city', 'country', 'type', 'rating', 'is_favorite'],
    ];

    public static function resources(): array
    {
        return array_keys(self::COLUMNS);
    }

    public function export(User $user, string $resource, string $format, array $ids = []): StreamedResponse|JsonResponse
    {
        $columns = self::COLUMNS[$resource];

        $rows = $this->query($resource, $user)
            ->when($ids !== [], fn ($query) => $query->whereIn('id', $ids))
            ->orderBy('id')
            ->get($columns)
            ->map(fn ($model) => collect($columns)->mapWithKeys(fn (string $column) => [
                $column => $this->stringify($model->getAttribute($column)),
            ])->all())
            ->all();

        return $format === 'json'
            ? $this->json($resource, $rows)
            : $this->csv($resource, $columns, $rows);
    }

    private function query(string $resource, User $user)
    {
        return match ($resource) {
            'sessions' => Session::query()->ownedBy($user->id),
            'clients' => Client::query()->ownedBy($user->id),
            'deliveries' => Delivery::query()->ownedBy($user->id),
            'tasks' => Task::query()->ownedBy($user->id),
            'photos' => Photo::query()->ownedBy($user->id),
            'gear' => GearItem::query()->ownedBy($user->id),
            'presets' => Preset::query()->ownedBy($user->id),
            'locations' => Location::query()->ownedBy($user->id),
        };
    }

    private function json(string $resource, array $rows): JsonResponse
    {
        return response()->json(
            ['resource' => $resource, 'exported_at' => now()->toISOString(), 'total' => count($rows), 'data' => $rows],
            200,
            ['Content-Disposition' => 'attachment; filename="'.$this->filename($resource, 'json').'"']
        );
    }

    private function csv(string $resource, array $columns, array $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($columns, $rows): void {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $columns, ',', '"', '\\');

            foreach ($rows as $row) {
                fputcsv($handle, array_values($row), ',', '"', '\\');
            }

            fclose($handle);
        }, $this->filename($resource, 'csv'), ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function filename(string $resource, string $extension): string
    {
        return "lumaflow-{$resource}-".now()->format('Ymd-His').".{$extension}";
    }

    private function stringify(mixed $value): string
    {
        return match (true) {
            $value === null => '',
            is_bool($value) => $value ? '1' : '0',
            $value instanceof \DateTimeInterface => $value->format('Y-m-d H:i:s'),
            is_array($value) => json_encode($value, JSON_UNESCAPED_UNICODE),
            default => (string) $value,
        };
    }
}
