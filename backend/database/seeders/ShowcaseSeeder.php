<?php

namespace Database\Seeders;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Contract;
use App\Models\Delivery;
use App\Models\Job;
use App\Models\Location;
use App\Models\Quote;
use App\Models\Session;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\ChecklistService;
use App\Services\CommercialDocumentService;
use App\Services\ContractService;
use App\Services\DeliveryRevisionService;
use App\Services\JobWorkflowService;
use App\Services\WorkspaceService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Estudio de demostración para exhibiciones locales.
 *
 * Crea un estudio ficticio con varios meses de actividad para que dashboard,
 * calendario, analítica y portales muestren un estado realista. Todos los
 * nombres, correos (dominio reservado .test) e importes son inventados.
 * Pasa por los servicios de dominio para respetar numeración, revisiones y
 * fronteras de workspace. Nunca se ejecuta en producción.
 */
class ShowcaseSeeder extends Seeder
{
    public const EMAIL = 'demo@lumaflow.test';

    private User $user;

    /** @var array<string, Client> */
    private array $clients = [];

    /** @var array<string, Location> */
    private array $locations = [];

    public function run(): void
    {
        if (app()->isProduction()) {
            throw new RuntimeException('ShowcaseSeeder solo puede ejecutarse en entornos locales.');
        }

        if (User::query()->where('email', self::EMAIL)->exists()) {
            $this->command?->warn('El estudio de demostración ya existe; no se modifica.');

            return;
        }

        DB::transaction(fn () => $this->seedStudio());
    }

    private function seedStudio(): void
    {
        $this->user = User::factory()->create([
            'name' => 'Marta Ríos',
            'email' => self::EMAIL,
            'studio_name' => 'Estudio Lumen',
            'studio_slug' => 'estudio-lumen',
            'photography_specialties' => ['wedding', 'portrait', 'product'],
            // Credencial local documentada en README; no es una cuenta real.
            'password' => (string) env('SHOWCASE_PASSWORD', 'lumaflow-demo'),
        ]);
        app(WorkspaceService::class)->ensureForUser($this->user);
        $this->user->refresh();

        $this->seedLibrary();
        $this->seedClients();
        $this->seedProjects();
        $this->seedBookingRequests();
        $this->seedNotifications();
        $this->backdateServiceActivity();
    }

    private function seedLibrary(): void
    {
        $gear = [
            ['Sony A7 IV', 'camera', 'Sony', 'ILCE-7M4', 658, 'active', true, 2490],
            ['Sony A7S III', 'camera', 'Sony', 'ILCE-7SM3', 699, 'active', true, 3790],
            ['Sigma 35mm Art', 'lens', 'Sigma', '35mm f/1.4 DG DN', 645, 'active', true, 879],
            ['Sony 85mm G Master', 'lens', 'Sony', 'FE 85mm f/1.4 GM', 820, 'active', true, 1699],
            ['Tamron 28-75mm', 'lens', 'Tamron', '28-75mm f/2.8 G2', 540, 'active', false, 849],
            ['Godox AD200 Pro', 'flash', 'Godox', 'AD200Pro', 900, 'active', false, 349],
            ['Aputure Amaran 200x', 'light', 'Aputure', 'Amaran 200x S', 1300, 'maintenance', false, 399],
            ['DJI RS 3 Mini', 'gimbal', 'DJI', 'RS 3 Mini', 795, 'active', false, 369],
            ['Manfrotto Befree', 'tripod', 'Manfrotto', 'Befree Advanced', 1500, 'active', false, 219],
            ['Tarjetas CFexpress 160 GB', 'sd_card', 'Sony', 'CEA-G160T', 10, 'active', false, 289],
        ];
        foreach ($gear as [$name, $category, $brand, $model, $weight, $condition, $favorite, $price]) {
            $this->user->gearItems()->create([
                'name' => $name, 'category' => $category, 'brand' => $brand, 'model' => $model,
                'weight_grams' => $weight, 'condition' => $condition, 'is_favorite' => $favorite,
                'purchase_price' => $price, 'purchase_date' => now()->subMonths(random_int(6, 30))->toDateString(),
                'notes' => $condition === 'maintenance' ? 'Ventilador ruidoso: revisión programada.' : null,
            ]);
        }

        $locations = [
            'retiro' => ['Palacio de Cristal · Retiro', 'Madrid', 40.4138, -3.6823, 'nature', 'Primera hora de la mañana', 'easy', 5, true, 'Luz suave filtrada por el cristal. Evitar fines de semana a mediodía.', ['parque', 'luz natural', 'retrato']],
            'toledo' => ['Mirador del Valle', 'Toledo', 39.8505, -4.0226, 'urban', 'Atardecer', 'medium', 5, true, 'Panorámica de la ciudad; ideal para preboda en hora dorada.', ['skyline', 'hora dorada', 'boda']],
            'segovia' => ['Acueducto de Segovia', 'Segovia', 40.9481, -4.1184, 'architecture', 'Hora azul', 'easy', 4, false, 'Mucho tránsito turístico; llegar 45 minutos antes del ocaso.', ['arquitectura', 'hora azul']],
            'estudio' => ['Estudio Lumen · Plató', 'Madrid', 40.4290, -3.7020, 'studio', 'Cualquier hora', 'easy', 5, true, 'Ciclorama blanco de 6 m, flashes y fondo de papel.', ['plató', 'producto', 'retrato']],
            'bodega' => ['Bodegas Altamira', 'La Rioja', 42.4627, -2.4450, 'interior', 'Media tarde', 'medium', 4, false, 'Sala de barricas con luz tenue: llevar iluminación continua.', ['interior', 'producto', 'vino']],
            'matadero' => ['Matadero Madrid', 'Madrid', 40.3920, -3.6970, 'industrial', 'Tarde', 'easy', 4, true, 'Naves de ladrillo con texturas; solicitar permiso para equipo grande.', ['industrial', 'editorial', 'evento']],
        ];
        foreach ($locations as $key => [$name, $city, $lat, $lng, $type, $bestTime, $difficulty, $rating, $favorite, $notes, $tags]) {
            $this->locations[$key] = $this->user->locations()->create([
                'name' => $name, 'city' => $city, 'country' => 'España', 'latitude' => $lat, 'longitude' => $lng,
                'type' => $type, 'best_time' => $bestTime, 'access_difficulty' => $difficulty, 'rating' => $rating,
                'is_favorite' => $favorite, 'notes' => $notes, 'tags' => $tags,
                'google_maps_url' => "https://www.google.com/maps/search/?api=1&query={$lat},{$lng}",
                'openstreetmap_url' => "https://www.openstreetmap.org/?mlat={$lat}&mlon={$lng}#map=16/{$lat}/{$lng}",
            ]);
        }

        $camera = $this->user->gearItems()->where('name', 'Sony A7 IV')->value('id');
        foreach ([
            ['Retrato exterior suave', 'Retrato', '200', 'f/1.8', '1/500', '5200K', '+0.3', 'Medir en piel, proteger altas luces.'],
            ['Producto en plató', 'Producto', '100', 'f/8', '1/160', '5600K', '0', 'Flash a 1/4 con softbox lateral y rebote.'],
            ['Banquete interior', 'Boda', '1600', 'f/2', '1/125', '3800K', '-0.3', 'Rebote al techo; desactivar estabilizador en trípode.'],
        ] as [$name, $category, $iso, $aperture, $shutter, $wb, $comp, $notes]) {
            $this->user->presets()->create([
                'gear_item_id' => $camera, 'name' => $name, 'category' => $category, 'iso' => $iso, 'aperture' => $aperture,
                'shutter_speed' => $shutter, 'white_balance' => $wb, 'exposure_compensation' => $comp, 'notes' => $notes,
            ]);
        }
    }

    private function seedClients(): void
    {
        $clients = [
            'lucia' => ['Lucía Fernández y Daniel Ortega', null, 'active', '@luciaydani', 'Boda en Toledo; prefieren estilo documental y poco posado.', 7],
            'hotel' => ['Hotel Mirador del Tajo', 'Hotel Mirador del Tajo', 'active', '@miradordeltajo', 'Contenido para eventos corporativos y bodas del hotel.', 8],
            'origen' => ['Alba Moreno', 'Casa Origen', 'active', '@casaorigen', 'Cosmética natural. Campañas de producto trimestrales.', 6],
            'brotola' => ['Javier Sanz', 'Café Brótola', 'active', '@cafebrotola', 'Carta nueva y redes sociales.', 5],
            'nerea' => ['Nerea Gil', null, 'active', '@nerea.gil', 'Retratos de marca personal para su consulta.', 4],
            'castillo' => ['Elena Castillo', 'Familia Castillo', 'active', null, 'Sesión familiar cada año.', 9],
            'vela' => ['Irene Vela', 'Atelier Vela', 'lead', '@ateliervela', 'Interesada en un lookbook de temporada.', 1],
            'altamira' => ['Pablo Medina', 'Bodegas Altamira', 'active', '@bodegasaltamira', 'Fotografía de producto y enoturismo.', 6],
            'norte' => ['Raúl Pérez', 'Arquitectura Norte', 'inactive', null, 'Proyecto cerrado; posible segundo reportaje más adelante.', 10],
            'sofia' => ['Sofía Herrera y Marc Puig', null, 'lead', null, 'Boda en Segovia el próximo año.', 0],
            'festival' => ['Carla Ibáñez', 'Festival Ruido Blanco', 'active', '@ruidoblancofest', 'Aftermovie y cobertura fotográfica del festival.', 5],
        ];
        foreach ($clients as $key => [$name, $company, $status, $instagram, $notes, $monthsAgo]) {
            $client = $this->user->clients()->create([
                'name' => $name, 'company' => $company, 'status' => $status, 'instagram' => $instagram, 'notes' => $notes,
                'email' => Str::slug($company ?? Str::before($name, ' y ')).'@example.test',
                'phone' => '+34 6'.random_int(10, 99).' '.random_int(100, 999).' '.random_int(100, 999),
            ]);
            $created = now()->subMonths($monthsAgo)->subDays(random_int(0, 20));
            $client->forceFill(['created_at' => $created, 'updated_at' => $created])->saveQuietly();
            $this->clients[$key] = $client;
        }
    }

    private function seedProjects(): void
    {
        $documents = app(CommercialDocumentService::class);

        // Proyecto principal: boda en postproducción con todo el flujo completo.
        $wedding = $this->job('lucia', 'Boda Lucía y Daniel', 'wedding', 'editing', -12, 3200, 'toledo', [
            'deposit_amount' => 800, 'contract_status' => 'signed', 'contract_signed_at' => now()->subMonths(3),
            'start_date' => now()->subDays(12)->toDateString(), 'end_date' => now()->subDays(12)->toDateString(),
            'delivery_due_date' => now()->addDays(16)->toDateString(),
            'description' => 'Boda civil en el Mirador del Valle con banquete en el hotel. 140 invitados.',
            'participants' => [['name' => 'Lucía Fernández', 'role' => 'Novia'], ['name' => 'Daniel Ortega', 'role' => 'Novio'], ['name' => 'Iván Ruiz', 'role' => 'Segundo fotógrafo']],
        ]);
        $preboda = $this->session($wedding, 'Preboda en el Mirador', -40, '19:00', 'portrait', 'delivered', 'toledo');
        $ceremony = $this->session($wedding, 'Boda Lucía y Daniel', -12, '12:30', 'wedding', 'editing', 'toledo', '23:30');
        $quote = $this->quote($documents, $wedding, 'accepted', -95, [
            ['Cobertura de boda (10 horas, dos fotógrafos)', 1, 2400],
            ['Sesión preboda', 1, 450],
            ['Álbum artesanal 30x30', 1, 350],
        ]);
        $this->invoice($documents, $quote, 'paid', -60, 'Señal y preboda');
        $contract = app(ContractService::class)->create($this->user, ['job_id' => $wedding->id, 'client_id' => $wedding->client_id, 'quote_id' => $quote->id, 'title' => 'Contrato de cobertura de boda']);
        app(ContractService::class)->transition($contract, $this->user, 'sent');
        app(ContractService::class)->transition($contract->fresh(), $this->user, 'accepted');
        $this->delivery($wedding, $preboda, 'Galería preboda', 'approved', -30, 450, 'paid', 'Pixieset');
        $this->delivery($wedding, $ceremony, 'Avance de la boda · 60 fotografías', 'pending', 2, 2750, 'partial', 'Pixieset');
        app(JobWorkflowService::class)->initialize($this->user, $wedding);
        $this->advanceStages($wedding, 3);
        foreach ([
            ['Preparativos', 'Detalles del vestido y anillos con luz de ventana', 'ready'],
            ['Ceremonia', 'Entrada de la novia desde el fondo del pasillo', 'done'],
            ['Ceremonia', 'Reacción del novio en plano corto', 'done'],
            ['Retratos', 'Pareja en el mirador en hora dorada', 'done'],
            ['Banquete', 'Primer baile con luz de ambiente', 'done'],
            ['Banquete', 'Discursos: plano general y reacciones', 'pending'],
        ] as $position => [$scene, $description, $status]) {
            $wedding->shots()->create([
                'user_id' => $this->user->id, 'workspace_id' => $wedding->workspace_id, 'session_id' => $ceremony->id,
                'scene' => $scene, 'description' => $description, 'status' => $status, 'position' => $position,
                'focal_length' => $position % 2 ? '85mm' : '35mm',
            ]);
        }
        $this->checklists($ceremony);

        // Campaña de producto recurrente, ya entregada y facturada.
        $origen = $this->job('origen', 'Campaña de temporada Casa Origen', 'product', 'delivered', -34, 1450, 'estudio');
        $origenSession = $this->session($origen, 'Bodegón de la nueva línea', -34, '10:00', 'product', 'delivered', 'estudio');
        $origenQuote = $this->quote($documents, $origen, 'accepted', -50, [['Jornada de producto en plató', 1, 900], ['Retoque avanzado por imagen', 22, 25]]);
        $this->invoice($documents, $origenQuote, 'paid', -25);
        $this->delivery($origen, $origenSession, 'Selección final Casa Origen', 'approved', -24, 1450, 'paid', 'Google Drive');

        $origenSpring = $this->job('origen', 'Nueva campaña Casa Origen', 'product', 'quoted', 26, 1600, 'estudio');
        $this->quote($documents, $origenSpring, 'sent', -3, [['Jornada de producto en plató', 1, 950], ['Retoque avanzado por imagen', 26, 25]]);

        // Evento corporativo cerrado y una factura vencida para mostrar avisos.
        $hotel = $this->job('hotel', 'Gala aniversario Hotel Mirador', 'events', 'closed', -70, 1800, 'toledo');
        $hotelSession = $this->session($hotel, 'Gala 25 aniversario', -70, '20:00', 'event', 'delivered', 'toledo');
        $hotelQuote = $this->quote($documents, $hotel, 'accepted', -90, [['Cobertura de evento (6 horas)', 1, 1500], ['Entrega exprés 48 h', 1, 300]]);
        $this->invoice($documents, $hotelQuote, 'paid', -62);
        $this->delivery($hotel, $hotelSession, 'Galería gala aniversario', 'approved', -64, 1800, 'paid', 'Pixieset');

        $hotelWinter = $this->job('hotel', 'Contenido para bodas del hotel', 'events', 'review', -8, 950, 'toledo');
        $hotelWinterSession = $this->session($hotelWinter, 'Montaje del salón de eventos', -8, '11:00', 'event', 'editing', 'toledo');
        $winterQuote = $this->quote($documents, $hotelWinter, 'accepted', -30, [['Reportaje de instalaciones', 1, 950]]);
        $this->invoice($documents, $winterQuote, 'overdue', -26, null, -6);
        $this->delivery($hotelWinter, $hotelWinterSession, 'Revisión salón de eventos', 'pending', -1, 950, 'pending', 'Dropbox');

        // Retrato y familia: recorrido corto y recurrente.
        $nerea = $this->job('nerea', 'Retratos marca personal Nerea', 'portrait', 'delivered', -48, 420, 'retiro');
        $nereaSession = $this->session($nerea, 'Retrato en el Palacio de Cristal', -48, '09:00', 'portrait', 'delivered', 'retiro');
        $nereaQuote = $this->quote($documents, $nerea, 'accepted', -60, [['Sesión de retrato (2 horas)', 1, 320], ['Fotografías adicionales', 5, 20]]);
        $this->invoice($documents, $nereaQuote, 'paid', -44);
        $this->delivery($nerea, $nereaSession, 'Retratos Nerea Gil', 'delivered', -43, 420, 'paid', 'Pixieset');

        $castillo = $this->job('castillo', 'Sesión familiar anual', 'family', 'confirmed', 3, 380, 'retiro');
        $this->session($castillo, 'Familia Castillo en el Retiro', 3, '10:30', 'portrait', 'confirmed', 'retiro');
        $castilloQuote = $this->quote($documents, $castillo, 'accepted', -14, [['Sesión familiar exterior', 1, 380]]);
        $this->invoice($documents, $castilloQuote, 'sent', -2, null, 12);

        $castilloPast = $this->job('castillo', 'Familia Castillo · sesión anterior', 'family', 'closed', -365, 350, 'retiro');
        $this->session($castilloPast, 'Familia Castillo · sesión anterior', -365, '10:30', 'portrait', 'delivered', 'retiro');

        // Gastronomía y vino.
        $brotola = $this->job('brotola', 'Nueva carta Café Brótola', 'product', 'shoot', 0, 680, 'estudio');
        $this->session($brotola, 'Platos de la nueva carta', 0, '16:30', 'product', 'confirmed', 'estudio');
        $brotolaQuote = $this->quote($documents, $brotola, 'accepted', -10, [['Fotografía gastronómica (media jornada)', 1, 520], ['Vídeos verticales para redes', 4, 40]]);
        $this->invoice($documents, $brotolaQuote, 'draft', -1, null, 29);

        $altamira = $this->job('altamira', 'Reportaje Bodegas Altamira', 'product', 'delivered', -58, 2100, 'bodega');
        $altamiraSession = $this->session($altamira, 'Viñedo y sala de barricas', -58, '17:00', 'product', 'delivered', 'bodega');
        $altamiraQuote = $this->quote($documents, $altamira, 'accepted', -75, [['Jornada en bodega con desplazamiento', 1, 1500], ['Bodegones de etiqueta', 12, 50]]);
        $this->invoice($documents, $altamiraQuote, 'paid', -50);
        $this->delivery($altamira, $altamiraSession, 'Reportaje en bodega', 'approved', -50, 2100, 'paid', 'Google Drive');

        $altamiraSummer = $this->job('altamira', 'Catas nocturnas', 'events', 'closed', -150, 900, 'bodega');
        $altamiraSummerSession = $this->session($altamiraSummer, 'Cata nocturna', -150, '21:00', 'event', 'delivered', 'bodega');
        $this->delivery($altamiraSummer, $altamiraSummerSession, 'Galería catas nocturnas', 'approved', -140, 900, 'paid', 'Pixieset');

        // Audiovisual y proyecto personal (Sprints 2–5).
        $festival = $this->job('festival', 'Aftermovie Ruido Blanco', 'other', 'delivered', -110, 2600, 'matadero', ['project_type' => 'audiovisual']);
        $festivalSession = $this->session($festival, 'Jornada principal del festival', -110, '18:00', 'event', 'delivered', 'matadero', '23:45');
        $festivalQuote = $this->quote($documents, $festival, 'accepted', -130, [['Aftermovie 90 s + 6 piezas verticales', 1, 2200], ['Cobertura fotográfica', 1, 400]]);
        $this->invoice($documents, $festivalQuote, 'paid', -96);
        $this->delivery($festival, $festivalSession, 'Aftermovie y piezas sociales', 'approved', -95, 2600, 'paid', 'Vimeo');

        $norte = $this->job('norte', 'Reportaje sede Arquitectura Norte', 'real_estate', 'closed', -180, 1100, 'segovia');
        $norteSession = $this->session($norte, 'Sede y espacios de trabajo', -180, '11:00', 'other', 'delivered', 'segovia');
        $this->delivery($norte, $norteSession, 'Reportaje arquitectura', 'approved', -170, 1100, 'paid', 'Dropbox');

        $personal = $this->job(null, 'Serie personal · Hora azul', 'other', 'preparation', 9, 0, 'segovia', ['project_type' => 'personal', 'contract_status' => 'not_required']);
        $this->session($personal, 'Hora azul en el acueducto', 9, '17:45', 'landscape', 'planned', 'segovia');

        // Embudo comercial abierto.
        $vela = $this->job('vela', 'Lookbook Atelier Vela', 'portrait', 'lead', 45, 1200, 'matadero', ['contract_status' => 'draft']);
        $this->quote($documents, $vela, 'draft', 0, [['Lookbook (12 looks, media jornada)', 1, 950], ['Retoque de piel por imagen', 24, 10]]);
        $sofia = $this->job('sofia', 'Boda Sofía y Marc', 'wedding', 'contract_pending', 210, 2900, 'segovia', ['contract_status' => 'sent']);
        $this->quote($documents, $sofia, 'accepted', -6, [['Cobertura de boda (8 horas)', 1, 2200], ['Sesión preboda', 1, 450], ['Segundo fotógrafo', 1, 250]]);
        $this->session($vela, 'Reunión de briefing Atelier Vela', 0, '11:00', 'other', 'planned', 'matadero');

        // Sesiones repartidas en meses anteriores para la analítica.
        // El año anterior tiene algo menos de actividad: la tendencia muestra un
        // crecimiento creíble en lugar de comparar contra un año vacío.
        $sessions = [
            [-200, 'portrait', 'Retrato corporativo'], [-160, 'product', 'Bodegón de temporada'], [-125, 'portrait', 'Book de actriz'],
            [-85, 'product', 'Packshot e-commerce'], [-77, 'urban', 'Editorial urbano'], [-20, 'portrait', 'Retrato de pareja'],
            [-235, 'portrait', 'Retrato de autor'], [-262, 'product', 'Lanzamiento de colección'], [-290, 'event', 'Evento de empresa'],
            [-318, 'portrait', 'Retrato familiar en casa'], [-345, 'product', 'Catálogo de producto'],
            [-390, 'product', 'Catálogo de accesorios'], [-420, 'portrait', 'Retrato de graduación'], [-455, 'wedding', 'Boda en finca'],
            [-480, 'portrait', 'Retrato familiar'], [-510, 'product', 'Bodegón de joyería'], [-540, 'urban', 'Editorial nocturno'],
            [-570, 'event', 'Presentación de producto'], [-600, 'portrait', 'Book de modelo'], [-630, 'wedding', 'Boda en la sierra'],
            [-660, 'product', 'Fotografía de carta'], [-690, 'portrait', 'Retrato de estudio'], [-720, 'event', 'Cena de empresa'],
        ];
        foreach ($sessions as [$offset, $type, $name]) {
            $this->user->sessions()->create([
                'name' => $name,
                'date' => now()->addDays($offset)->toDateString(), 'time' => '10:00', 'session_type' => $type, 'status' => 'delivered',
                'location_id' => $this->locations[$type === 'product' ? 'estudio' : 'retiro']->id,
                'location_name' => $this->locations[$type === 'product' ? 'estudio' : 'retiro']->name,
            ]);
        }

        $this->seedTasks($wedding, $brotola, $hotelWinter);
    }

    private function seedTasks(Job $wedding, Job $brotola, Job $hotelWinter): void
    {
        foreach ([
            [$wedding, 'Seleccionar 60 imágenes para el avance', 'urgent', 'in_progress', 1],
            [$wedding, 'Exportar galería completa en alta resolución', 'high', 'todo', 10],
            [$wedding, 'Maquetar álbum y enviar prueba', 'medium', 'todo', 20],
            [$brotola, 'Confirmar platos y estilismo con cocina', 'high', 'todo', 0],
            [$hotelWinter, 'Recordar factura vencida al hotel', 'high', 'todo', -2],
            [null, 'Renovar seguro de responsabilidad civil', 'medium', 'waiting', 14],
            [null, 'Copia de seguridad trimestral de catálogos', 'low', 'completed', -5],
            [null, 'Publicar caso de estudio Casa Origen', 'low', 'todo', 7],
        ] as $position => [$job, $title, $priority, $status, $due]) {
            $this->user->tasks()->create([
                'job_id' => $job?->id, 'client_id' => $job?->client_id, 'title' => $title, 'priority' => $priority,
                'status' => $status, 'due_date' => now()->addDays($due)->toDateString(), 'position' => $position,
                'completed_at' => $status === 'completed' ? now()->addDays($due) : null,
            ]);
        }
    }

    private function seedBookingRequests(): void
    {
        foreach ([
            ['Claudia Navarro', 'wedding', 160, 'Boda en una finca de Ávila, unos 90 invitados. ¿Tenéis disponibilidad?', 'new'],
            ['Tomás Aguilar', 'portrait', 12, 'Necesito retratos para el lanzamiento de mi libro.', 'new'],
            ['Restaurante Brasa Viva', 'product', 25, 'Buscamos fotografía para carta y web.', 'contacted'],
            ['Andrea Prieto', 'event', -10, 'Comunión, solo la ceremonia.', 'archived'],
        ] as [$name, $type, $days, $message, $status]) {
            $this->user->bookingRequests()->create([
                'name' => $name, 'email' => Str::slug($name).'@example.test', 'session_type' => $type,
                'preferred_date' => now()->addDays($days)->toDateString(), 'message' => $message, 'status' => $status,
            ]);
        }
    }

    private function seedNotifications(): void
    {
        $this->user->notifications()->createMany([
            ['type' => 'warning', 'title' => 'Factura vencida', 'message' => 'Hotel Mirador del Tajo · Contenido para bodas del hotel.', 'link' => '/app/invoices'],
            ['type' => 'info', 'title' => 'Nueva solicitud de reserva', 'message' => 'Claudia Navarro quiere reservar una boda.', 'link' => '/app/booking-requests'],
            ['type' => 'success', 'title' => 'Contrato aceptado', 'message' => 'Lucía y Daniel han aceptado el contrato.', 'link' => '/app/contracts', 'read_at' => now()->subDays(2)],
        ]);
    }

    private function job(?string $client, string $title, string $specialty, string $status, int $offset, float $budget, string $location, array $extra = []): Job
    {
        $job = $this->user->jobs()->create([
            'client_id' => $client ? $this->clients[$client]->id : null,
            'location_id' => $this->locations[$location]->id,
            'title' => $title,
            'specialty' => $specialty,
            'workflow_key' => $specialty,
            'status' => $status,
            'event_date' => now()->addDays($offset)->toDateString(),
            'budget' => $budget,
            'contract_status' => in_array($status, ['lead', 'quoted'], true) ? 'draft' : 'signed',
            'project_type' => 'photography',
            ...$extra,
        ]);
        $created = now()->addDays(min($offset, 0) - 30);
        $job->forceFill(['created_at' => $created, 'updated_at' => $created])->saveQuietly();
        $this->activity($job, ActivityLogger::CREATED, "Proyecto creado: {$title}", $created);
        if ($status !== 'lead') {
            $this->activity($job, ActivityLogger::STATUS_CHANGED, 'Estado actualizado', $created->copy()->addDays(10), ['from' => 'lead', 'to' => $status]);
        }

        return $job;
    }

    /** Registra actividad con la fecha en que habría ocurrido en un estudio real. */
    private function activity(Model $subject, string $type, string $description, Carbon $at, array $properties = []): void
    {
        $at = $at->isFuture() ? now()->subHour() : $at;
        app(ActivityLogger::class)->log($this->user, $subject, $type, $description, $properties)
            ->forceFill(['created_at' => $at, 'updated_at' => $at])->saveQuietly();
    }

    /** Las entregas y contratos los registran sus servicios con la hora actual; se fechan como el resto. */
    private function backdateServiceActivity(): void
    {
        foreach (Activity::query()->where('user_id', $this->user->id)->whereIn('subject_type', [(new Delivery)->getMorphClass(), (new Contract)->getMorphClass()])->get() as $activity) {
            $subject = $activity->subject;
            $at = $subject instanceof Delivery && $subject->delivery_date
                ? Carbon::parse($subject->delivery_date)->setTime(18, 30)
                : now()->subMonths(3);
            $at = $at->isFuture() ? now()->subHours(2) : $at;
            $activity->forceFill(['created_at' => $at, 'updated_at' => $at])->saveQuietly();
        }
    }

    private function session(Job $job, string $name, int $offset, string $time, string $type, string $status, string $location, ?string $end = null): Session
    {
        return $this->user->sessions()->create([
            'job_id' => $job->id, 'location_id' => $this->locations[$location]->id, 'location_name' => $this->locations[$location]->name,
            'name' => $name, 'date' => now()->addDays($offset)->toDateString(), 'time' => $time, 'end_time' => $end,
            'session_type' => $type, 'status' => $status, 'client_name' => $job->client?->name,
        ]);
    }

    private function quote(CommercialDocumentService $documents, Job $job, string $status, int $issued, array $items): Quote
    {
        $quote = $documents->createQuote($this->user, [
            'job_id' => $job->id, 'client_id' => $job->client_id, 'tax_rate' => 21,
            // La sesión principal del proyecto, si ya existe, identifica el presupuesto en los listados.
            'session_id' => $job->sessions()->orderByDesc('date')->value('id'),
            'valid_until' => now()->addDays($issued + 30)->toDateString(),
            'notes' => 'Precios con IVA desglosado. Validez de 30 días.',
            'items' => array_map(fn (array $item) => ['description' => $item[0], 'quantity' => $item[1], 'unit_price' => $item[2]], $items),
        ]);
        $quote->update(['status' => $status, 'issue_date' => now()->addDays($issued)->toDateString()]);

        return $quote;
    }

    private function invoice(CommercialDocumentService $documents, Quote $quote, string $status, int $issued, ?string $notes = null, int $due = 15): void
    {
        $invoice = $documents->createInvoice($this->user, $quote, ['due_date' => now()->addDays($issued + $due)->toDateString(), 'notes' => $notes]);
        $invoice->update([
            'status' => $status,
            'issue_date' => now()->addDays($issued)->toDateString(),
            'due_date' => now()->addDays($status === 'overdue' ? $due : $issued + $due)->toDateString(),
            'payment_date' => $status === 'paid' ? now()->addDays($issued + 5)->toDateString() : null,
        ]);
    }

    private function delivery(Job $job, Session $session, string $title, string $status, int $offset, float $budget, string $payment, string $provider): Delivery
    {
        $delivery = app(DeliveryRevisionService::class)->create($this->user, [
            'client_id' => $job->client_id, 'session_id' => $session->id, 'title' => $title, 'status' => $status,
            'budget' => $budget, 'payment_status' => $payment, 'amount_paid' => match ($payment) {
                'paid' => $budget, 'partial' => round($budget * 0.3), default => 0
            },
            'delivery_date' => now()->addDays($offset)->toDateString(),
            'gallery_url' => 'https://example.com/galerias/'.Str::slug($title),
            'gallery_provider' => $provider,
            'gallery_expires_at' => now()->addDays($offset + 90)->toDateString(),
            'public_token' => Str::random(40),
        ], $job);

        if ($status === 'approved') {
            $delivery->forceFill(['client_message' => '¡Nos encantan! Muchas gracias por el trabajo.', 'client_responded_at' => Carbon::parse($delivery->delivery_date)->addDays(2)])->saveQuietly();
        }

        return $delivery;
    }

    private function advanceStages(Job $job, int $completed): void
    {
        foreach ($job->stages()->orderBy('position')->get() as $index => $stage) {
            $stage->update([
                'status' => $index < $completed ? 'completed' : ($index === $completed ? 'in_progress' : 'pending'),
                'due_date' => now()->addDays(($index - $completed) * 4 + 3)->toDateString(),
            ]);
        }
    }

    private function checklists(Session $session): void
    {
        foreach (['gear' => 'Equipo', 'preparation' => 'Preparación', 'editing' => 'Edición'] as $type => $name) {
            $checklist = $this->user->checklists()->create(['session_id' => $session->id, 'name' => $name, 'type' => $type, 'position' => 0]);
            foreach (ChecklistService::TEMPLATES[$type] as $position => $title) {
                $done = $type !== 'editing' || $position < 2;
                $checklist->items()->create(['title' => $title, 'position' => $position, 'is_completed' => $done, 'completed_at' => $done ? now()->subDays(12) : null]);
            }
        }
    }
}
