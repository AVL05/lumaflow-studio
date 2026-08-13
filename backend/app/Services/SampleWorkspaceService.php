<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class SampleWorkspaceService
{
    public function activate(User $user): User
    {
        if ($user->sample_workspace_activated_at) {
            return $user;
        }

        return DB::transaction(function () use ($user): User {
            $user->refresh();

            if ($user->sample_workspace_activated_at) {
                return $user;
            }

            $location = $user->locations()->create([
                'name' => 'Invernadero Botánico · Ejemplo',
                'city' => 'Madrid',
                'country' => 'España',
                'latitude' => 40.416775,
                'longitude' => -3.703790,
                'type' => 'interior',
                'best_time' => '17:30',
                'access_difficulty' => 'easy',
                'rating' => 5,
                'is_favorite' => true,
                'notes' => 'Registro de ejemplo. Puedes editarlo o eliminarlo.',
                'tags' => ['luz natural', 'editorial'],
                'recommended_gear' => ['35mm', 'reflector'],
            ]);

            $client = $user->clients()->create([
                'name' => 'Lucía y Mateo · Ejemplo',
                'email' => 'lucia.mateo@example.test',
                'phone' => '+34 600 000 001',
                'status' => 'active',
                'notes' => 'Cliente ficticio para explorar LumaFlow.',
            ]);

            $brand = $user->clients()->create([
                'name' => 'Alba Moreno · Ejemplo',
                'email' => 'alba@example.test',
                'company' => 'Casa Origen',
                'status' => 'lead',
                'notes' => 'Lead ficticio para explorar el flujo comercial.',
            ]);

            $weddingJob = $user->jobs()->create([
                'client_id' => $client->id,
                'location_id' => $location->id,
                'title' => 'Boda Lucía + Mateo · Ejemplo',
                'specialty' => 'wedding',
                'workflow_key' => 'wedding',
                'status' => 'preparation',
                'event_date' => now()->addDays(8)->toDateString(),
                'budget' => 2400,
                'deposit_amount' => 600,
                'contract_status' => 'signed',
                'contract_signed_at' => now()->subDays(2),
            ]);

            $productJob = $user->jobs()->create([
                'client_id' => $brand->id,
                'title' => 'Campaña Casa Origen · Ejemplo',
                'specialty' => 'product',
                'workflow_key' => 'product',
                'status' => 'quoted',
                'event_date' => now()->addDays(15)->toDateString(),
                'budget' => 980,
                'contract_status' => 'draft',
            ]);

            $wedding = $user->sessions()->create([
                'job_id' => $weddingJob->id,
                'location_id' => $location->id,
                'name' => 'Preboda Lucía y Mateo · Ejemplo',
                'date' => now()->addDays(8)->toDateString(),
                'time' => '17:30',
                'location_name' => $location->name,
                'session_type' => 'portrait',
                'status' => 'confirmed',
                'description' => 'Sesión ficticia para recorrer el flujo de producción.',
                'client_name' => $client->name,
            ]);

            $product = $user->sessions()->create([
                'job_id' => $productJob->id,
                'name' => 'Campaña Casa Origen · Ejemplo',
                'date' => now()->addDays(15)->toDateString(),
                'time' => '10:00',
                'location_name' => 'Estudio principal',
                'session_type' => 'product',
                'status' => 'planned',
                'client_name' => $brand->name,
            ]);

            $user->deliveries()->create([
                'job_id' => $weddingJob->id,
                'client_id' => $client->id,
                'session_id' => $wedding->id,
                'title' => 'Selección preboda · Ejemplo',
                'status' => 'pending',
                'budget' => 480,
                'delivery_date' => now()->addDays(18)->toDateString(),
                'private_notes' => 'Entrega ficticia. No se enviará ningún correo real.',
            ]);

            $user->tasks()->createMany([
                [
                    'job_id' => $weddingJob->id,
                    'session_id' => $wedding->id,
                    'client_id' => $client->id,
                    'title' => 'Confirmar localización · Ejemplo',
                    'priority' => 'high',
                    'status' => 'in_progress',
                    'due_date' => now()->addDays(3)->toDateString(),
                ],
                [
                    'job_id' => $productJob->id,
                    'session_id' => $product->id,
                    'client_id' => $brand->id,
                    'title' => 'Preparar moodboard · Ejemplo',
                    'priority' => 'medium',
                    'status' => 'todo',
                    'due_date' => now()->addDays(6)->toDateString(),
                ],
            ]);

            $user->forceFill(['sample_workspace_activated_at' => now()])->save();

            return $user->refresh();
        });
    }
}
