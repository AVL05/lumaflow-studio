<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'totalSessions' => $this->resource['totalSessions'],
            'upcomingSessions' => SessionResource::collection($this->resource['upcomingSessions']),
            'sessionsByStatus' => $this->resource['sessionsByStatus'],
            'totalPhotos' => $this->resource['totalPhotos'],
            'totalGear' => $this->resource['totalGear'],
            'totalPresets' => $this->resource['totalPresets'],
            'totalTags' => $this->resource['totalTags'],
            'totalLocations' => $this->resource['totalLocations'],
            'totalClients' => $this->resource['totalClients'],
            'activeClients' => $this->resource['activeClients'],
            'pendingDeliveries' => $this->resource['pendingDeliveries'],
            'deliveredProjects' => $this->resource['deliveredProjects'],
            'topPresets' => PresetResource::collection($this->resource['topPresets']),
            'latestAlbums' => AlbumResource::collection($this->resource['latestAlbums']),
            'latestLocations' => LocationResource::collection($this->resource['latestLocations']),
            'favoriteLocations' => LocationResource::collection($this->resource['favoriteLocations']),
            'topLocationCities' => $this->resource['topLocationCities'],
            'upcomingSessionsWithLocation' => SessionResource::collection($this->resource['upcomingSessionsWithLocation']),
            'recentClients' => ClientResource::collection($this->resource['recentClients']),
            'upcomingDeliveries' => DeliveryResource::collection($this->resource['upcomingDeliveries']),
            'favoritePhotos' => PhotoResource::collection($this->resource['favoritePhotos']),
            'exifSummary' => $this->resource['exifSummary'],
            'latestAiAnalysis' => new AiAnalysisResource($this->resource['latestAiAnalysis']),
            'ollamaStatus' => $this->resource['ollamaStatus'],
            'latestAiRecommendations' => $this->resource['latestAiRecommendations'],
            'recentActivity' => $this->resource['recentActivity'],
        ];
    }
}
