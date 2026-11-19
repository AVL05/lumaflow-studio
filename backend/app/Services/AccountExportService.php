<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\BookingRequest;
use App\Models\Checklist;
use App\Models\Client;
use App\Models\Contract;
use App\Models\Delivery;
use App\Models\GearItem;
use App\Models\Invoice;
use App\Models\Job;
use App\Models\Location;
use App\Models\Preset;
use App\Models\Quote;
use App\Models\Session;
use App\Models\Task;
use App\Models\User;

/**
 * Exportacion completa de los datos a los que el usuario tiene acceso (#67).
 *
 * Solo lee a traves del scope `accessibleBy`: nunca incluye datos de otros estudios.
 * Excluye credenciales y enlaces publicos (token del portal, contrasena de galeria).
 */
class AccountExportService
{
    /** @var array<string, class-string> */
    private const RESOURCES = [
        'clients' => Client::class,
        'jobs' => Job::class,
        'sessions' => Session::class,
        'tasks' => Task::class,
        'quotes' => Quote::class,
        'invoices' => Invoice::class,
        'contracts' => Contract::class,
        'deliveries' => Delivery::class,
        'locations' => Location::class,
        'gear' => GearItem::class,
        'presets' => Preset::class,
        'booking_requests' => BookingRequest::class,
        'checklists' => Checklist::class,
        'activities' => Activity::class,
    ];

    /** Atributos que nunca salen en la exportacion. */
    private const SECRETS = ['gallery_password', 'public_token', 'calendar_token', 'password', 'remember_token'];

    public function build(User $user): array
    {
        $data = [];

        foreach (self::RESOURCES as $key => $model) {
            $data[$key] = $model::query()
                ->accessibleBy($user)
                ->orderBy('id')
                ->get()
                ->map(fn ($record) => $this->clean($record->makeHidden(self::SECRETS)->toArray()))
                ->all();
        }

        return [
            'exported_at' => now()->toISOString(),
            'format_version' => 1,
            'account' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'studio_name' => $user->studio_name,
                'country' => $user->country,
                'currency' => $user->currency,
            ],
            'totals' => array_map('count', $data),
            'data' => $data,
        ];
    }

    private function clean(array $row): array
    {
        return array_diff_key($row, array_flip(self::SECRETS));
    }
}
