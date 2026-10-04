<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\ContractPortalLink;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Enlaces publicos del contrato (Issue #8).
 *
 * El token plano (64 caracteres aleatorios) solo se muestra al generar o
 * regenerar; despues solo vive su hash SHA-256. Regenerar invalida el
 * anterior de inmediato; revocar no toca el estado del contrato.
 */
class ContractPortalService
{
    /** Validez por defecto de un enlace recien generado. */
    public const DEFAULT_TTL_DAYS = 30;

    public function __construct(
        private readonly WorkspaceAuthorizer $authorizer,
        private readonly ActivityLogger $activity,
    ) {}

    /**
     * @return array{link: ContractPortalLink, token: string}
     */
    public function generate(User $user, Contract $contract, ?string $expiresAt = null): array
    {
        $this->authorizer->requireAccessOr404($user, $contract);
        abort_if($contract->getAttribute('status') === Contract::STATUS_DRAFT,
            422, 'Un borrador no tiene portal público.');

        abort_if($this->activeLink($contract) instanceof ContractPortalLink,
            422, 'Ya existe un enlace activo. Regenérelo o revóquelo primero.');

        return DB::transaction(function () use ($user, $contract, $expiresAt): array {
            $token = Str::random(64);

            $link = ContractPortalLink::query()->create([
                'contract_id' => $contract->getKey(),
                'token_hash' => hash('sha256', $token),
                'expires_at' => $expiresAt ?? now()->addDays(self::DEFAULT_TTL_DAYS),
            ]);

            $this->activity->log($user, $contract, 'portal_generated', 'Enlace público generado.');

            return ['link' => $link, 'token' => $token];
        });
    }

    /**
     * @return array{link: ContractPortalLink, token: string}
     */
    public function regenerate(User $user, Contract $contract, ?string $expiresAt = null): array
    {
        $this->authorizer->requireAccessOr404($user, $contract);
        abort_if($contract->getAttribute('status') === Contract::STATUS_DRAFT,
            422, 'Un borrador no tiene portal público.');

        return DB::transaction(function () use ($user, $contract, $expiresAt): array {
            ContractPortalLink::query()
                ->where('contract_id', $contract->getKey())
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            $token = Str::random(64);

            $link = ContractPortalLink::query()->create([
                'contract_id' => $contract->getKey(),
                'token_hash' => hash('sha256', $token),
                'expires_at' => $expiresAt ?? now()->addDays(self::DEFAULT_TTL_DAYS),
            ]);

            $this->activity->log($user, $contract, 'portal_regenerated', 'Enlace público regenerado.');

            return ['link' => $link, 'token' => $token];
        });
    }

    public function revoke(User $user, Contract $contract): void
    {
        $this->authorizer->requireAccessOr404($user, $contract);

        $link = $this->activeLink($contract);

        abort_if(! $link instanceof ContractPortalLink, 404);

        $link->forceFill(['revoked_at' => now()])->saveQuietly();
        $this->activity->log($user, $contract, 'portal_revoked', 'Enlace público revocado.');
    }

    public function activeLink(Contract $contract): ?ContractPortalLink
    {
        return ContractPortalLink::query()
            ->where('contract_id', $contract->getKey())
            ->active()
            ->latest()
            ->first();
    }

    /**
     * Resuelve un enlace utilizable o 404 uniforme (sin distinguir entre
     * desconocido, revocado, expirado o contrato no enviable).
     */
    public function resolveUsable(string $plainToken): ContractPortalLink
    {
        $link = ContractPortalLink::query()
            ->where('token_hash', hash('sha256', trim($plainToken)))
            ->with(['contract.client', 'contract.job', 'contract.user'])
            ->first();

        abort_if(! $link instanceof ContractPortalLink || ! $link->isUsable(), 404);

        $contract = $link->contract;

        abort_if(! $contract instanceof Contract
            || $contract->getAttribute('status') === Contract::STATUS_DRAFT, 404);

        // El portal solo muestra el snapshot congelado al enviar: sin
        // snapshot valido no hay portal utilizable (nunca fallback al
        // contenido editable interno).
        abort_if(blank($contract->getAttribute('content_snapshot')), 404);

        $link->forceFill(['last_used_at' => now()])->saveQuietly();

        return $link->refresh();
    }

    public function accept(ContractPortalLink $link, ?string $message = null): Contract
    {
        return DB::transaction(function () use ($link): Contract {
            $contract = $link->contract()->lockForUpdate()->first();

            abort_if($contract->getAttribute('status') !== Contract::STATUS_SENT
                && $contract->getAttribute('status') !== Contract::STATUS_ACCEPTED, 422,
                'Este contrato ya no admite aceptación.');

            if ($contract->getAttribute('status') === Contract::STATUS_ACCEPTED) {
                return $contract->load(['client', 'job']);
            }

            $contract->forceFill(['client_responded_at' => now()])->saveQuietly();

            return app(ContractService::class)->transition(
                $contract, $contract->user, Contract::STATUS_ACCEPTED
            );
        });
    }

    public function reject(ContractPortalLink $link, ?string $message = null): Contract
    {
        $clean = $message === null ? null : trim(strip_tags($message));

        abort_if($clean !== null && mb_strlen($clean) > 2000, 422,
            'El comentario no puede superar los 2000 caracteres.');

        return DB::transaction(function () use ($link, $clean): Contract {
            $contract = $link->contract()->lockForUpdate()->first();

            abort_if($contract->getAttribute('status') !== Contract::STATUS_SENT
                && $contract->getAttribute('status') !== Contract::STATUS_REJECTED, 422,
                'Este contrato ya no admite rechazo.');

            if ($contract->getAttribute('status') === Contract::STATUS_REJECTED) {
                return $contract->load(['client', 'job']);
            }

            if ($clean !== null && $clean !== '') {
                $contract->forceFill([
                    'client_message' => $clean,
                    'client_responded_at' => now(),
                ])->saveQuietly();
            }

            return app(ContractService::class)->transition(
                $contract, $contract->user, Contract::STATUS_REJECTED
            );
        });
    }
}
