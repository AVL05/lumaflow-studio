<?php

namespace App\Providers;

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
        VerifyEmail::toMailUsing(fn (object $notifiable, string $url): MailMessage => (new MailMessage)
            ->subject('Verifica tu email en LumaFlow')
            ->greeting('Hola '.$notifiable->name)
            ->line('Confirma que este email te pertenece para continuar con la configuracion de tu estudio.')
            ->action('Verificar email', $url)
            ->line('El enlace caduca en 60 minutos. Si no has creado esta cuenta, puedes ignorar este mensaje.'));
    }
}
