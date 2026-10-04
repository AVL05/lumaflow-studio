<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Contract;
use App\Models\Job;
use App\Models\Quote;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Lifecycle contractual (Issue #7). Unica abstraccion con las reglas de
 * transicion: los controladores no deciden estados.
 *
 * draft -> sent -> accepted | rejected | expired. Sin retornos: un contrato
 * enviado no vuelve a borrador y los terminales no cambian. El contenido
 * queda congelado en `content_snapshot` al enviar.
 */
class ContractService
{
    public const TRANSITIONS = [
        Contract::STATUS_DRAFT => [Contract::STATUS_SENT],
        Contract::STATUS_SENT => [Contract::STATUS_ACCEPTED, Contract::STATUS_REJECTED, Contract::STATUS_EXPIRED],
        Contract::STATUS_ACCEPTED => [],
        Contract::STATUS_REJECTED => [],
        Contract::STATUS_EXPIRED => [],
    ];

    public function __construct(private readonly ActivityLogger $activity) {}

    public function create(User $user, array $data): Contract
    {
        return DB::transaction(function () use ($user, $data): Contract {
            [$job, $client, $quote] = $this->resolveParties($user, $data);

            $contract = $user->contracts()->create([
                'client_id' => $client->getKey(),
                'job_id' => $job->getKey(),
                'quote_id' => $quote?->getKey(),
                'contract_number' => $this->nextNumber($user),
                'title' => $data['title'],
                'content' => $data['content'] ?? $this->composeContent($job, $client, $quote),
                'status' => Contract::STATUS_DRAFT,
                'version' => 1,
                'expires_at' => $data['expires_at'] ?? null,
            ]);

            $this->activity->log($user, $contract, ActivityLogger::CREATED, "Contrato creado: {$contract->title}");

            return $contract->load(['client', 'job', 'quote']);
        });
    }

    public function update(Contract $contract, User $actor, array $data): Contract
    {
        if ($contract->getAttribute('status') === Contract::STATUS_SENT) {
            $this->assertOnlyExpiryChanges($contract, $data);
            $contract->update(['expires_at' => $data['expires_at'] ?? null]);

            return $contract->refresh()->load(['client', 'job', 'quote']);
        }

        abort_if($contract->isTerminal() || $contract->getAttribute('status') !== Contract::STATUS_DRAFT,
            422, 'Solo un borrador puede editarse.');

        return DB::transaction(function () use ($contract, $actor, $data): Contract {
            if (isset($data['job_id']) || isset($data['client_id']) || isset($data['quote_id'])) {
                [$job, $client, $quote] = $this->resolvePartiesForUpdate($contract, $actor, $data);
                $data['job_id'] = $job->getKey();
                $data['client_id'] = $client->getKey();
                $data['quote_id'] = $quote?->getKey();
            }

            $contract->update($data);

            return $contract->refresh()->load(['client', 'job', 'quote']);
        });
    }

    public function transition(Contract $contract, User $actor, string $to): Contract
    {
        $from = (string) $contract->getAttribute('status');

        abort_if(! in_array($to, self::TRANSITIONS[$from] ?? [], true),
            422, "Transición no permitida de {$from} a {$to}.");

        return DB::transaction(function () use ($contract, $actor, $from, $to): Contract {
            $attributes = ['status' => $to];

            if ($to === Contract::STATUS_SENT) {
                $attributes['content_snapshot'] = (string) $contract->getAttribute('content');
                $attributes['version'] = ((int) $contract->getAttribute('version')) + 1;
                $attributes['sent_at'] = now();
            }

            if ($to === Contract::STATUS_ACCEPTED) {
                $attributes['accepted_at'] = now();
            }

            if ($to === Contract::STATUS_REJECTED) {
                $attributes['rejected_at'] = now();
            }

            $contract->update($attributes);
            $this->syncJob($contract, $to);
            $this->activity->logStatusChange($actor, $contract, $from, $to);

            return $contract->refresh()->load(['client', 'job', 'quote']);
        });
    }

    /**
     * Enviado: el contenido queda bloqueado. Solo se acepta la caducidad y
     * unicamente si el resto llega identico al actual (sin cambios mudos).
     */
    private function assertOnlyExpiryChanges(Contract $contract, array $data): void
    {
        foreach (['job_id', 'client_id', 'quote_id', 'title', 'content'] as $field) {
            $incoming = $data[$field] ?? null;
            $current = $contract->getAttribute($field);

            if ((string) ($incoming ?? '') !== (string) ($current ?? '')) {
                abort(422, 'Un contrato enviado solo admite cambiar la caducidad.');
            }
        }
    }

    private function resolvePartiesForUpdate(Contract $contract, User $actor, array $data): array
    {
        $merged = [
            'job_id' => $data['job_id'] ?? $contract->getAttribute('job_id'),
            'client_id' => $data['client_id'] ?? $contract->getAttribute('client_id'),
            'quote_id' => $data['quote_id'] ?? $contract->getAttribute('quote_id'),
        ];

        $job = Job::query()->accessibleBy($actor)->findOrFail($merged['job_id']);
        $client = Client::query()->accessibleBy($actor)->findOrFail($merged['client_id']);
        $quote = $merged['quote_id']
            ? Quote::query()->accessibleBy($actor)->findOrFail($merged['quote_id'])
            : null;

        $this->assertCoherence($job, $client, $quote);

        return [$job, $client, $quote];
    }

    private function resolveParties(User $user, array $data): array
    {
        $job = Job::query()->accessibleBy($user)->findOrFail($data['job_id']);
        $client = Client::query()->accessibleBy($user)->findOrFail($data['client_id']);
        $quote = isset($data['quote_id'])
            ? Quote::query()->accessibleBy($user)->findOrFail($data['quote_id'])
            : null;

        $this->assertCoherence($job, $client, $quote);

        return [$job, $client, $quote];
    }

    private function assertCoherence(Job $job, Client $client, ?Quote $quote): void
    {
        if ((int) $job->getAttribute('workspace_id') !== (int) $client->getAttribute('workspace_id')) {
            throw ValidationException::withMessages([
                'client_id' => 'El cliente debe pertenecer al mismo estudio que el trabajo.',
            ]);
        }

        if ($job->getAttribute('client_id') && (int) $job->getAttribute('client_id') !== (int) $client->getKey()) {
            throw ValidationException::withMessages([
                'client_id' => 'El cliente no coincide con el cliente del trabajo.',
            ]);
        }

        if ($quote instanceof Quote) {
            if ((int) $quote->getAttribute('workspace_id') !== (int) $job->getAttribute('workspace_id')) {
                throw ValidationException::withMessages([
                    'quote_id' => 'El presupuesto debe pertenecer al mismo estudio.',
                ]);
            }

            if ($quote->getAttribute('job_id') && (int) $quote->getAttribute('job_id') !== (int) $job->getKey()) {
                throw ValidationException::withMessages([
                    'quote_id' => 'El presupuesto no corresponde a este trabajo.',
                ]);
            }

            if ($quote->getAttribute('client_id') && (int) $quote->getAttribute('client_id') !== (int) $client->getKey()) {
                throw ValidationException::withMessages([
                    'quote_id' => 'El presupuesto no corresponde a este cliente.',
                ]);
            }
        }
    }

    /**
     * Espejo unidireccional hacia los campos legacy del trabajo (Issue #7).
     * El contrato es canonico; estos campos se conservan por compatibilidad
     * y podran eliminarse en un Issue posterior.
     */
    private function syncJob(Contract $contract, string $to): void
    {
        $job = $contract->job;

        if (! $job instanceof Job) {
            return;
        }

        match ($to) {
            Contract::STATUS_SENT => $job->update(['contract_status' => 'sent']),
            Contract::STATUS_ACCEPTED => $job->update([
                'contract_status' => 'signed',
                'contract_signed_at' => now(),
            ]),
            Contract::STATUS_REJECTED => $job->update(['contract_status' => 'declined']),
            default => null,
        };
    }

    /**
     * Contenido neutral de producto (datos del servicio, alcance, importes,
     * fechas). Editable y sin valor juridico: no es asesoramiento legal.
     */
    public function composeContent(Job $job, Client $client, ?Quote $quote): string
    {
        $lines = [
            "# {$job->getAttribute('title')}",
            '',
            "Cliente: {$client->getAttribute('name')}",
            'Fecha del evento: '.($job->event_date?->toDateString() ?? 'a convenir'),
            'Presupuesto: '.($job->getAttribute('budget') ?? 'a convenir').' EUR',
            'Señal: '.($job->getAttribute('deposit_amount') ?? 0).' EUR',
        ];

        if ($quote instanceof Quote) {
            $lines[] = "Presupuesto {$quote->getAttribute('quote_number')}: {$quote->getAttribute('total')} EUR (IVA incluido).";
        }

        if ($job->getAttribute('description')) {
            $lines[] = '';
            $lines[] = 'Alcance:';
            $lines[] = (string) $job->getAttribute('description');
        }

        $lines[] = '';
        $lines[] = '_Contenido editable de ejemplo. No constituye asesoramiento jurídico: consulta a un profesional si necesitas requisitos legales específicos._';

        return implode("\n", $lines);
    }

    private function nextNumber(User $user): string
    {
        $year = now()->year;
        $workspaceId = (int) ($user->getAttribute('current_workspace_id') ?? 0);
        $last = Contract::query()->where('workspace_id', $workspaceId)->where('contract_number', 'like', "CON-{$year}-%")
            ->lockForUpdate()->orderByDesc('id')->value('contract_number');
        $sequence = $last ? ((int) str($last)->afterLast('-')->toString()) + 1 : 1;

        return sprintf('CON-%d-%04d', $year, $sequence);
    }
}
