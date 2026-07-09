<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Delivery;
use App\Models\Session;
use App\Models\User;
use App\Services\ChecklistService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $user->sessions()->createMany([
            [
                'name' => 'Editorial urbano',
                'date' => now()->addDays(4)->toDateString(),
                'location_name' => 'Madrid centro',
                'session_type' => 'urban',
                'description' => 'Sesion editorial urbana para portfolio nocturno.',
                'client_name' => 'Cliente editorial',
                'status' => 'planned',
                'notes' => 'Look nocturno con acento calido.',
            ],
            [
                'name' => 'Producto premium',
                'date' => now()->subDays(2)->toDateString(),
                'location_name' => 'Estudio',
                'session_type' => 'product',
                'description' => 'Fotografia de producto con luz controlada.',
                'client_name' => 'Marca premium',
                'status' => 'editing',
                'notes' => 'Priorizar limpieza de reflejos.',
            ],
        ]);

        $user->gearItems()->createMany([
            [
                'name' => 'Sony A7 IV',
                'category' => 'camera',
                'brand' => 'Sony',
                'model' => 'A7 IV',
                'condition' => 'active',
                'is_favorite' => true,
            ],
            [
                'name' => 'Sigma 35mm Art',
                'category' => 'lens',
                'brand' => 'Sigma',
                'model' => '35mm f/1.4 DG DN',
                'condition' => 'active',
                'is_favorite' => true,
            ],
        ]);

        $locations = $user->locations()->createMany([
            [
                'name' => 'Azotea Gran Via',
                'city' => 'Madrid',
                'country' => 'Espana',
                'latitude' => 40.4202800,
                'longitude' => -3.7057700,
                'type' => 'urban',
                'best_time' => 'Blue hour',
                'access_difficulty' => 'medium',
                'rating' => 5,
                'is_favorite' => true,
                'access_mode' => 'public_transport',
                'permissions_required' => 'Confirmar permiso de acceso con recepcion.',
                'cost' => 35,
                'google_maps_url' => 'https://www.google.com/maps/search/?api=1&query=40.42028,-3.70577',
                'apple_maps_url' => 'https://maps.apple.com/?ll=40.42028,-3.70577&q=Azotea%20Gran%20Via',
                'openstreetmap_url' => 'https://www.openstreetmap.org/?mlat=40.42028&mlon=-3.70577#map=16/40.42028/-3.70577',
                'recommended_weather' => 'Cielo despejado o nubes altas.',
                'recommended_seasons' => ['spring', 'autumn'],
                'notes' => 'Buen fondo urbano con luces y lineas verticales.',
                'tags' => ['blue hour', 'urban', 'editorial'],
                'recommended_gear' => ['35mm', 'tripod', 'light'],
            ],
            [
                'name' => 'Estudio Norte',
                'city' => 'Madrid',
                'country' => 'Espana',
                'latitude' => 40.4451200,
                'longitude' => -3.6919000,
                'type' => 'studio',
                'best_time' => 'Manana',
                'access_difficulty' => 'easy',
                'rating' => 4,
                'is_favorite' => false,
                'access_mode' => 'car',
                'permissions_required' => 'Reserva previa.',
                'cost' => 120,
                'google_maps_url' => 'https://www.google.com/maps/search/?api=1&query=40.44512,-3.69190',
                'apple_maps_url' => 'https://maps.apple.com/?ll=40.44512,-3.69190&q=Estudio%20Norte',
                'openstreetmap_url' => 'https://www.openstreetmap.org/?mlat=40.44512&mlon=-3.69190#map=16/40.44512/-3.69190',
                'recommended_weather' => 'Independiente del clima.',
                'recommended_seasons' => ['winter', 'summer'],
                'notes' => 'Interior controlado para retrato y producto.',
                'tags' => ['studio', 'portrait', 'product'],
                'recommended_gear' => ['flash', 'softbox', '85mm'],
            ],
        ]);

        $user->sessions()->where('session_type', 'urban')->update(['location_id' => $locations[0]->id]);
        $user->sessions()->where('session_type', 'product')->update(['location_id' => $locations[1]->id]);

        $client = $user->clients()->create([
            'name' => 'Marca premium',
            'email' => 'studio@example.com',
            'company' => 'Marca premium',
            'instagram' => '@marca.premium',
            'status' => 'active',
            'notes' => 'Cliente de producto y contenido editorial.',
        ]);

        $delivery = $user->deliveries()->create([
            'client_id' => $client->id,
            'session_id' => $user->sessions()->where('session_type', 'product')->value('id'),
            'title' => 'Entrega Producto Premium',
            'status' => 'pending',
            'budget' => 1200,
            'delivery_date' => now()->addDays(10)->toDateString(),
            'gallery_url' => 'https://example.com/gallery/producto-premium',
            'private_notes' => 'Preparar seleccion final y preset cinematico suave.',
        ]);

        $this->seedWorkflow($user, $client, $delivery);
    }

    /** Datos de la fase 9: tareas, checklists, recordatorios, actividad y notificaciones. */
    private function seedWorkflow(User $user, Client $client, Delivery $delivery): void
    {
        $urbanSession = $user->sessions()->where('session_type', 'urban')->firstOrFail();
        $productSession = $user->sessions()->where('session_type', 'product')->firstOrFail();

        $user->tasks()->createMany([
            [
                'session_id' => $urbanSession->id,
                'title' => 'Confirmar permisos de azotea',
                'description' => 'Llamar a recepcion y cerrar franja horaria de blue hour.',
                'priority' => 'urgent',
                'status' => 'todo',
                'due_date' => now()->addDays(2)->toDateString(),
                'due_time' => '10:00',
            ],
            [
                'session_id' => $urbanSession->id,
                'title' => 'Preparar moodboard editorial',
                'priority' => 'medium',
                'status' => 'in_progress',
                'due_date' => now()->addDays(3)->toDateString(),
            ],
            [
                'session_id' => $productSession->id,
                'client_id' => $client->id,
                'title' => 'Seleccion final producto premium',
                'priority' => 'high',
                'status' => 'waiting',
                'due_date' => now()->addDays(5)->toDateString(),
            ],
            [
                'client_id' => $client->id,
                'title' => 'Enviar presupuesto trimestral',
                'priority' => 'low',
                'status' => 'completed',
                'due_date' => now()->subDays(4)->toDateString(),
                'completed_at' => now()->subDays(3),
            ],
        ]);

        $checklistNames = ['gear' => 'Equipo', 'preparation' => 'Preparacion', 'editing' => 'Edicion'];

        foreach (array_keys($checklistNames) as $index => $type) {
            $checklist = $user->checklists()->create([
                'session_id' => $urbanSession->id,
                'name' => $checklistNames[$type],
                'type' => $type,
                'position' => $index,
            ]);

            foreach (ChecklistService::TEMPLATES[$type] as $position => $title) {
                $checklist->items()->create([
                    'title' => $title,
                    'position' => $position,
                    'is_completed' => $type === 'gear' && $position < 2,
                    'completed_at' => $type === 'gear' && $position < 2 ? now()->subHours(5) : null,
                ]);
            }
        }

        $user->activities()->createMany([
            [
                'subject_type' => Session::class,
                'subject_id' => $urbanSession->id,
                'type' => 'created',
                'description' => 'Sesion creada: '.$urbanSession->name,
            ],
            [
                'subject_type' => Session::class,
                'subject_id' => $productSession->id,
                'type' => 'status_changed',
                'description' => 'Estado planned -> editing',
                'properties' => ['from' => 'planned', 'to' => 'editing'],
            ],
            [
                'subject_type' => Delivery::class,
                'subject_id' => $delivery->id,
                'type' => 'created',
                'description' => 'Entrega creada: '.$delivery->title,
            ],
        ]);

        $user->notifications()->createMany([
            [
                'type' => 'info',
                'title' => 'Sesion proxima',
                'message' => $urbanSession->name.' en pocos dias.',
                'link' => '/app/sessions',
            ],
            [
                'type' => 'warning',
                'title' => 'Tarea urgente pendiente',
                'message' => 'Confirmar permisos de azotea.',
                'link' => '/app/tasks',
            ],
            [
                'type' => 'success',
                'title' => 'Equipo registrado',
                'message' => 'Sony A7 IV anadido al inventario.',
                'link' => '/app/gear',
                'read_at' => now()->subDay(),
            ],
        ]);
    }
}
