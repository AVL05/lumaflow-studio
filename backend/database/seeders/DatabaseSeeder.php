<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

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

        $user->presets()->createMany([
            [
                'name' => 'Warm Editorial Base',
                'description' => 'Base calida para piel y luz ambiente.',
                'category' => 'portrait',
                'style' => 'warm',
                'contrast' => 18,
                'shadows' => -12,
                'highlights' => -8,
                'whites' => 6,
                'blacks' => -10,
                'saturation' => 6,
                'vibrance' => 10,
                'temperature' => 14,
                'tint' => 2,
                'grain' => 8,
                'clarity' => 10,
                'texture' => 6,
                'intensity' => 70,
                'sharpness' => 20,
                'noise_reduction' => 5,
                'vignette' => -8,
                'recommended_use' => 'Retrato editorial y sesiones urbanas con piel calida.',
                'is_favorite' => true,
                'color' => '#d6a15f',
                'version' => '1.0',
                'usage_count' => 6,
            ],
            [
                'name' => 'Cinematic Night',
                'description' => 'Contraste nocturno controlado para neones y escenas urbanas.',
                'category' => 'color',
                'style' => 'cinematic',
                'contrast' => 24,
                'shadows' => -20,
                'highlights' => -15,
                'whites' => -4,
                'blacks' => -18,
                'saturation' => -4,
                'vibrance' => 8,
                'temperature' => -6,
                'tint' => 4,
                'grain' => 12,
                'clarity' => 16,
                'texture' => 10,
                'intensity' => 78,
                'sharpness' => 18,
                'noise_reduction' => 8,
                'vignette' => -16,
                'recommended_use' => 'Nocturnas, neones y ambientes de bajo contraste.',
                'is_favorite' => false,
                'color' => '#7c8ea6',
                'version' => '1.1',
                'usage_count' => 3,
            ],
        ]);

        $tags = collect(['Golden Hour', 'Blue Hour', 'Sunset', 'Portrait', 'Studio', 'Outdoor', 'Night', 'Cars', 'Nature', 'Travel'])
            ->map(fn (string $name) => $user->tags()->create([
                'name' => $name,
                'slug' => Str::slug($name),
                'color' => '#d6b17a',
            ]));

        $user->albums()->create([
            'name' => 'Portfolio Editorial',
            'description' => 'Seleccion inicial para trabajos editoriales y sesiones urbanas.',
            'color' => '#d6a15f',
            'date' => now()->toDateString(),
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

        $user->deliveries()->create([
            'client_id' => $client->id,
            'session_id' => $user->sessions()->where('session_type', 'product')->value('id'),
            'title' => 'Entrega Producto Premium',
            'status' => 'pending',
            'budget' => 1200,
            'delivery_date' => now()->addDays(10)->toDateString(),
            'gallery_url' => 'https://example.com/gallery/producto-premium',
            'private_notes' => 'Preparar seleccion final y preset cinematico suave.',
        ]);
    }
}
