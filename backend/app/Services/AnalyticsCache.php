<?php

namespace App\Services;

use App\Models\User;
use Closure;
use Illuminate\Support\Facades\Cache;

/**
 * Cache de agregados de analytics (Issue #9). Unica forma de construir
 * keys, leer, escribir e invalidar.
 *
 * - La base de datos sigue siendo canonica: miss calcula y guarda,
 *   hit devuelve, mutacion relevante invalida.
 * - Aislamiento por workspace: la key incluye el conjunto ordenado de
 *   memberships; dos workspaces nunca comparten datos.
 * - El rango from/to forma parte de la key de forma determinista.
 * - Como los stores portables (array/file/database) no permiten listar
 *   keys, cada workspace mantiene un indice de keys escritas para poder
 *   invalidar con precision sin barridos globales.
 */
class AnalyticsCache
{
    public const VERSION = 'v1';

    public static function ttl(): int
    {
        return max(1, (int) config('analytics.cache_ttl', 300));
    }

    /** @return int[] */
    public static function scopeIds(User $user): array
    {
        $ids = app(WorkspaceAuthorizer::class)->workspaceIds($user);
        sort($ids);

        return array_values(array_unique(array_map(intval(...), $ids)));
    }

    public static function keyFor(User $user, string $from, string $to): string
    {
        $ids = static::scopeIds($user);
        $scope = $ids === [] ? 'none' : implode('-', $ids);

        return 'lumaflow:analytics:'.self::VERSION.":ws:{$scope}:{$from}:{$to}";
    }

    public static function indexKey(int $workspaceId): string
    {
        return 'lumaflow:analytics:'.self::VERSION.":wsidx:{$workspaceId}";
    }

    /**
     * @return array<string, mixed>
     */
    public static function remember(User $user, string $from, string $to, Closure $compute): array
    {
        $key = static::keyFor($user, $from, $to);
        $hit = Cache::get($key);

        if (is_array($hit)) {
            return $hit;
        }

        $data = $compute();
        Cache::put($key, $data, static::ttl());
        static::trackKey($user, $key);

        return $data;
    }

    /**
     * Invalida todo lo cacheado que incluya ese workspace, usando el
     * workspace_id de la entidad mutada (nunca el usuario autenticado).
     */
    public static function flushForWorkspace(?int $workspaceId): void
    {
        if (! $workspaceId) {
            return;
        }

        $indexKey = static::indexKey($workspaceId);
        $keys = Cache::get($indexKey, []);

        foreach ((array) $keys as $key) {
            Cache::forget($key);
        }

        Cache::forget($indexKey);
    }

    private static function trackKey(User $user, string $key): void
    {
        foreach (static::scopeIds($user) as $workspaceId) {
            $indexKey = static::indexKey($workspaceId);
            $keys = array_unique([...(array) Cache::get($indexKey, []), $key]);
            Cache::put($indexKey, array_values($keys), static::ttl());
        }
    }
}
