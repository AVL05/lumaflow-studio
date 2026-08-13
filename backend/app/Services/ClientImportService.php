<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class ClientImportService
{
    public function import(User $user, array $rows): array
    {
        return DB::transaction(function () use ($user, $rows): array {
            $imported = 0;
            $skipped = 0;

            foreach ($rows as $row) {
                $email = isset($row['email']) ? mb_strtolower(trim($row['email'])) : null;

                if ($email && $user->clients()->whereRaw('LOWER(email) = ?', [$email])->exists()) {
                    $skipped++;

                    continue;
                }

                $user->clients()->create([
                    'name' => trim($row['name']),
                    'email' => $email ?: null,
                    'phone' => $row['phone'] ?? null,
                    'company' => $row['company'] ?? null,
                    'notes' => $row['notes'] ?? null,
                    'status' => 'lead',
                ]);
                $imported++;
            }

            return compact('imported', 'skipped');
        });
    }
}
