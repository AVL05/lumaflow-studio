<?php

namespace App\Providers;

use App\Models\AiAnalysis;
use App\Models\AiConversation;
use App\Models\AiSessionPlan;
use App\Models\Client;
use App\Models\Delivery;
use App\Models\Location;
use App\Models\Session;
use App\Models\Task;
use App\Models\User;
use App\Observers\AnalyticsInvalidationObserver;
use App\Observers\UserObserver;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        User::observe(UserObserver::class);

        // Entidades que alimentan los KPIs de analytics: cualquier
        // create/update/delete invalida la cache de su workspace.
        foreach ([Session::class, Delivery::class, Client::class, Task::class, AiAnalysis::class, AiConversation::class, AiSessionPlan::class, Location::class] as $model) {
            $model::observe(AnalyticsInvalidationObserver::class);
        }

        VerifyEmail::toMailUsing(fn (object $notifiable, string $url): MailMessage => (new MailMessage)
            ->subject('Verifica tu email en LumaFlow')
            ->greeting('Hola '.$notifiable->name)
            ->line('Confirma que este email te pertenece para continuar con la configuracion de tu estudio.')
            ->action('Verificar email', $url)
            ->line('El enlace caduca en 60 minutos. Si no has creado esta cuenta, puedes ignorar este mensaje.'));
    }
}
