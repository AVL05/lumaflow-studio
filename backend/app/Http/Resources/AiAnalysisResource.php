<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AiAnalysisResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'photo_id' => $this->photo_id,
            'type' => $this->type,
            'prompt' => $this->prompt,
            'result' => $this->result,
            'summary' => $this->summary,
            'score' => $this->score,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
