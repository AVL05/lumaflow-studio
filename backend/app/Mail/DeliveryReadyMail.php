<?php

namespace App\Mail;

use App\Models\Delivery;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class DeliveryReadyMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly Delivery $delivery, public readonly string $portalUrl)
    {
        $this->delivery->loadMissing(['user', 'client']);
    }

    public function build(): self
    {
        return $this
            ->subject("Tu galeria de \"{$this->delivery->title}\" esta lista")
            ->view('emails.delivery-ready')
            ->with([
                'delivery' => $this->delivery,
                'portalUrl' => $this->portalUrl,
                'studioName' => $this->delivery->user->name,
                'clientName' => $this->delivery->client->name,
            ]);
    }
}
