<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Cuentas base de la suite E2E.
 *
 * Crea dos estudios ficticios, ya verificados y configurados como lo estaria un
 * estudio real tras el registro y el onboarding. Los recursos de dominio los crea
 * cada test, de modo que los recorridos no dependan del orden de ejecucion.
 */
class E2ESeeder extends Seeder
{
    public function run(): void
    {
        // Las credenciales las define la suite E2E (e2e/support/accounts.js) y
        // llegan por entorno para no duplicar datos de test en dos lenguajes.
        // Los valores por defecto solo se usan al ejecutar el seeder a mano.
        $password = (string) env('E2E_PASSWORD', 'lumaflow-e2e');

        User::factory()->create([
            'name' => 'Estudio E2E Principal',
            'email' => (string) env('E2E_OWNER_EMAIL', 'e2e.estudio@lumaflow.test'),
            'studio_name' => 'Estudio E2E Principal',
            'studio_slug' => 'estudio-e2e-principal',
            'password' => $password,
        ]);

        User::factory()->create([
            'name' => 'Estudio E2E Ajeno',
            'email' => (string) env('E2E_OUTSIDER_EMAIL', 'e2e.ajeno@lumaflow.test'),
            'studio_name' => 'Estudio E2E Ajeno',
            'studio_slug' => 'estudio-e2e-ajeno',
            'password' => $password,
        ]);

        // El backend mantiene una sesion activa por usuario, asi que el recorrido
        // de acceso usa una cuenta propia para no invalidar las otras sesiones.
        User::factory()->create([
            'name' => 'Estudio E2E Acceso',
            'email' => (string) env('E2E_ACCESS_EMAIL', 'e2e.acceso@lumaflow.test'),
            'studio_name' => 'Estudio E2E Acceso',
            'studio_slug' => 'estudio-e2e-acceso',
            'password' => $password,
        ]);

        // El recorrido del estudio compartido invita a una cuenta ya operativa
        // para no consumir los limites de registro/verificacion del backend.
        User::factory()->create([
            'name' => 'Estudio E2E Invitado',
            'email' => (string) env('E2E_GUEST_EMAIL', 'e2e.invitado@lumaflow.test'),
            'studio_name' => 'Estudio E2E Invitado',
            'studio_slug' => 'estudio-e2e-invitado',
            'password' => $password,
        ]);

        // El recorrido de onboarding parte de una cuenta verificada pero sin
        // configurar, como un registro real tras verificar el email.
        User::factory()->withoutOnboarding()->create([
            'name' => 'Estudio E2E Nuevo',
            'email' => (string) env('E2E_NEWCOMER_EMAIL', 'e2e.nuevo@lumaflow.test'),
            'studio_slug' => 'estudio-e2e-nuevo',
            'password' => $password,
        ]);
    }
}
