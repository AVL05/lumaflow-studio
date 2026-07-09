<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        $url = rtrim(config('app.frontend_url'), '/').'/reset-password?'.http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);

        return (new MailMessage)
            ->subject('Restablecer password de LumaFlow Studio')
            ->line('Recibimos una solicitud para restablecer el password de tu cuenta.')
            ->action('Restablecer password', $url)
            ->line('Este enlace caduca en 60 minutos.')
            ->line('Si no solicitaste este cambio, puedes ignorar este email.');
    }
}
