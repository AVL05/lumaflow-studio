<?php

namespace App\Support;

/**
 * Render's `generateValue` produces a bare base64 string (44 chars), but Laravel only decodes
 * keys that carry the `base64:` prefix; a bare 44-char key fails with "Unsupported cipher or
 * incorrect key length" on every request that touches the encrypter. `docker/entrypoint.sh`
 * adds the prefix, but a `dockerCommand` override can skip the entrypoint, so the config does
 * not depend on it.
 */
class AppKey
{
    public static function normalize(?string $key): ?string
    {
        if ($key === null || $key === '' || str_starts_with($key, 'base64:')) {
            return $key;
        }

        // A raw 32-byte key is already valid as-is.
        if (strlen($key) === 32) {
            return $key;
        }

        $decoded = base64_decode($key, true);

        return $decoded !== false && strlen($decoded) === 32 ? 'base64:'.$key : $key;
    }
}
