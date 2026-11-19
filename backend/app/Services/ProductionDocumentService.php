<?php

namespace App\Services;

use App\Models\Job;
use Barryvdh\DomPDF\Facade\Pdf;

class ProductionDocumentService
{
    public function pdf(Job $job, ?int $sessionId): mixed
    {
        $shots = $job->shots()->with(['location', 'gearItems'])->when($sessionId, fn ($q) => $q->where('session_id', $sessionId))->limit(501)->get();
        abort_if($shots->count() > 500, 422, 'El documento admite hasta 500 tomas. Exporta por jornada para reducir su tamaño.');
        $days = $job->sessions()->with(['location', 'checklists.items'])->when($sessionId, fn ($q) => $q->whereKey($sessionId))->orderBy('date')->orderBy('time')->get();

        return Pdf::loadView('pdf.production', compact('job', 'shots', 'days'))
            ->setOptions(['isRemoteEnabled' => false, 'isPhpEnabled' => false])
            ->download('produccion-'.$job->id.'.pdf');
    }
}
