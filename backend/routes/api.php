<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\BulkActionController;
use App\Http\Controllers\Api\CalendarController;
use App\Http\Controllers\Api\ChecklistController;
use App\Http\Controllers\Api\ChecklistItemController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DeliveryController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\GearItemController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\SystemController;
use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);

// Endpoints sin autenticar: limite estricto para frenar fuerza bruta y registro masivo.
Route::middleware('throttle:10,1')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

Route::middleware(['auth:sanctum', 'throttle:180,1'])->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('/dashboard', DashboardController::class);

    Route::apiResource('sessions', SessionController::class);
    Route::apiResource('gear', GearItemController::class)->parameters(['gear' => 'gearItem']);
    Route::apiResource('locations', LocationController::class);
    Route::apiResource('clients', ClientController::class);
    Route::apiResource('deliveries', DeliveryController::class);

    Route::get('/ai/status', [AiController::class, 'status']);

    // La inferencia local es cara: se limita aparte del resto de la API.
    Route::middleware('throttle:20,1')->group(function (): void {
        Route::post('/ai/chat', [AiController::class, 'chat']);
        Route::post('/ai/session-plan', [AiController::class, 'sessionPlan']);
        Route::post('/ai/recommend-gear', [AiController::class, 'recommendGear']);
    });

    Route::get('/ai/history', [AiController::class, 'history']);
    Route::get('/ai/history/{conversation}', [AiController::class, 'showHistory']);
    Route::patch('/ai/history/{conversation}', [AiController::class, 'updateHistory']);
    Route::delete('/ai/history/{conversation}', [AiController::class, 'deleteHistory']);

    Route::get('/system', SystemController::class);

    // Fase 9: workflow enterprise
    Route::get('/tasks/summary', [TaskController::class, 'summary']);
    Route::apiResource('tasks', TaskController::class);

    Route::get('/checklists/templates', [ChecklistController::class, 'templates']);
    Route::apiResource('checklists', ChecklistController::class);
    Route::post('/checklists/{checklist}/duplicate', [ChecklistController::class, 'duplicate']);
    Route::put('/checklists/{checklist}/reorder', [ChecklistController::class, 'reorder']);
    Route::post('/checklists/{checklist}/items', [ChecklistItemController::class, 'store']);
    Route::put('/checklist-items/{item}', [ChecklistItemController::class, 'update']);
    Route::patch('/checklist-items/{item}/toggle', [ChecklistItemController::class, 'toggle']);
    Route::delete('/checklist-items/{item}', [ChecklistItemController::class, 'destroy']);

    Route::get('/activities', [ActivityController::class, 'index']);
    Route::get('/sessions/{session}/timeline', [ActivityController::class, 'session']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::delete('/notifications/clear', [NotificationController::class, 'clear']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

    Route::get('/calendar', [CalendarController::class, 'index']);
    Route::patch('/calendar/move', [CalendarController::class, 'move']);

    Route::get('/search', SearchController::class);
    Route::get('/analytics', AnalyticsController::class);

    Route::post('/bulk-actions', BulkActionController::class);
    Route::match(['get', 'post'], '/exports/{resource}', ExportController::class);
});
