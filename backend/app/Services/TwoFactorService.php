<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Str;

/**
 * 2FA opcional con TOTP (RFC 6238: HMAC-SHA1, 6 digitos, 30 s) y codigos de recuperacion de un
 * solo uso. Sin dependencias: el algoritmo es corto y esta cubierto por vectores de prueba.
 */
class TwoFactorService
{
    private const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    private const PERIOD = 30;

    private const DIGITS = 6;

    private const RECOVERY_CODES = 8;

    public function generateSecret(): string
    {
        return self::base32Encode(random_bytes(20));
    }

    public function otpauthUri(User $user, string $secret): string
    {
        $issuer = rawurlencode((string) config('app.name', 'LumaFlow Studio'));
        $label = $issuer.':'.rawurlencode($user->email);

        return "otpauth://totp/{$label}?secret={$secret}&issuer={$issuer}&algorithm=SHA1&digits=".self::DIGITS.'&period='.self::PERIOD;
    }

    public function isEnabled(User $user): bool
    {
        return $user->two_factor_confirmed_at !== null && $user->two_factor_secret !== null;
    }

    /** Codigo TOTP de un secreto en un instante (expuesto para pruebas). */
    public function codeAt(string $secret, int $timestamp): string
    {
        return $this->hotp($secret, intdiv($timestamp, self::PERIOD));
    }

    /**
     * Comprueba un codigo TOTP con tolerancia de +-1 intervalo y sin permitir reutilizarlo.
     * Devuelve el intervalo aceptado, o null.
     */
    public function verifyCode(string $secret, string $code, ?int $afterSlice = null, ?int $now = null): ?int
    {
        $code = preg_replace('/\s+/', '', $code) ?? '';

        if (! preg_match('/^\d{'.self::DIGITS.'}$/', $code)) {
            return null;
        }

        $current = intdiv($now ?? time(), self::PERIOD);

        for ($slice = $current - 1; $slice <= $current + 1; $slice++) {
            if ($afterSlice !== null && $slice <= $afterSlice) {
                continue;
            }

            if (hash_equals($this->hotp($secret, $slice), $code)) {
                return $slice;
            }
        }

        return null;
    }

    /**
     * Valida el segundo factor de un usuario con TOTP o codigo de recuperacion y registra el uso.
     */
    public function attempt(User $user, string $code): bool
    {
        if (! $this->isEnabled($user)) {
            return false;
        }

        $slice = $this->verifyCode((string) $user->two_factor_secret, $code, $user->two_factor_last_slice);

        if ($slice !== null) {
            $user->forceFill(['two_factor_last_slice' => $slice])->save();

            return true;
        }

        return $this->consumeRecoveryCode($user, $code);
    }

    /** @return list<string> Codigos en claro (solo se muestran una vez). */
    public function generateRecoveryCodes(User $user): array
    {
        $plain = [];
        $hashed = [];

        for ($i = 0; $i < self::RECOVERY_CODES; $i++) {
            $code = Str::lower(Str::random(5).'-'.Str::random(5));
            $plain[] = $code;
            $hashed[] = hash('sha256', $code);
        }

        $user->forceFill(['two_factor_recovery_codes' => $hashed])->save();

        return $plain;
    }

    public function remainingRecoveryCodes(User $user): int
    {
        return count($user->two_factor_recovery_codes ?? []);
    }

    private function consumeRecoveryCode(User $user, string $code): bool
    {
        $hash = hash('sha256', Str::lower(trim($code)));
        $codes = $user->two_factor_recovery_codes ?? [];

        foreach ($codes as $index => $stored) {
            if (hash_equals($stored, $hash)) {
                unset($codes[$index]);
                $user->forceFill(['two_factor_recovery_codes' => array_values($codes)])->save();

                return true;
            }
        }

        return false;
    }

    private function hotp(string $secret, int $counter): string
    {
        $hash = hash_hmac('sha1', pack('N2', 0, $counter), self::base32Decode($secret), true);
        $offset = ord($hash[19]) & 0x0F;
        $value = unpack('N', substr($hash, $offset, 4))[1] & 0x7FFFFFFF;

        return str_pad((string) ($value % (10 ** self::DIGITS)), self::DIGITS, '0', STR_PAD_LEFT);
    }

    public static function base32Encode(string $data): string
    {
        $bits = '';
        foreach (str_split($data) as $char) {
            $bits .= str_pad(decbin(ord($char)), 8, '0', STR_PAD_LEFT);
        }

        $out = '';
        foreach (str_split($bits, 5) as $chunk) {
            $out .= self::ALPHABET[bindec(str_pad($chunk, 5, '0', STR_PAD_RIGHT))];
        }

        return $out;
    }

    public static function base32Decode(string $encoded): string
    {
        $bits = '';
        foreach (str_split(strtoupper(rtrim($encoded, '='))) as $char) {
            $position = strpos(self::ALPHABET, $char);
            if ($position === false) {
                continue;
            }
            $bits .= str_pad(decbin($position), 5, '0', STR_PAD_LEFT);
        }

        $out = '';
        foreach (str_split($bits, 8) as $byte) {
            if (strlen($byte) === 8) {
                $out .= chr(bindec($byte));
            }
        }

        return $out;
    }
}
