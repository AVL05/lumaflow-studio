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
            'totalGear' => $this->resource['totalGear'],
            'totalLocations' => $this->resource['totalLocations'],
            'totalClients' => $this->resource['totalClients'],
            'activeClients' => $this->resource['activeClients'],
            'pendingDeliveries' => $this->resource['pendingDeliveries'],
            'deliveredProjects' => $this->resource['deliveredProjects'],
            'latestLocations' => LocationResource::collection($this->resource['latestLocations']),
            'favoriteLocations' => LocationResource::collection($this->resource['favoriteLocations']),
            'topLocationCities' => $this->resource['topLocationCities'],
            'upcomingSessionsWithLocation' => SessionResource::collection($this->resource['upcomingSessionsWithLocation']),
            'recentClients' => ClientResource::collection($this->resource['recentClients']),
            'upcomingDeliveries' => DeliveryResource::collection($this->resource['upcomingDeliveries']),
            'latestAiAnalysis' => new AiAnalysisResource($this->resource['latestAiAnalysis']),
            'ollamaStatus' => $this->resource['ollamaStatus'],
            'latestAiRecommendations' => $this->resource['latestAiRecommendations'],
            'aiUsage' => $this->resource['aiUsage'],
            'latestAiSessionPlans' => AiSessionPlanResource::collection($this->resource['latestAiSessionPlans']),
            'todayAgenda' => $this->resource['todayAgenda'],
            'pendingTasks' => TaskResource::collection($this->resource['pendingTasks']),
            'taskSummary' => $this->resource['taskSummary'],
            'unreadNotifications' => $this->resource['unreadNotifications'],
            'monthlyProgress' => $this->resource['monthlyProgress'],
            'favoriteGear' => GearItemResource::collection($this->resource['favoriteGear']),
            'timeline' => ActivityResource::collection($this->resource['timeline']),
        ];
    }
}
