<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\AlbumController;
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
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PhotoController;
use App\Http\Controllers\Api\PresetController;
use App\Http\Controllers\Api\ReminderController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\TagController;
use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('/dashboard', DashboardController::class);
    Route::get('/dashboard/summary', DashboardController::class);

    Route::apiResource('sessions', SessionController::class);
    Route::apiResource('gear', GearItemController::class)->parameters(['gear' => 'gearItem']);
    Route::apiResource('presets', PresetController::class);
    Route::post('/presets/{preset}/duplicate', [PresetController::class, 'duplicate']);
    Route::apiResource('albums', AlbumController::class);
    Route::apiResource('tags', TagController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::apiResource('locations', LocationController::class);
    Route::apiResource('clients', ClientController::class);
    Route::apiResource('deliveries', DeliveryController::class);

    Route::get('/gallery/photos', [PhotoController::class, 'index']);
    Route::get('/photos', [PhotoController::class, 'index']);
    Route::post('/photos/upload', [PhotoController::class, 'upload']);
    Route::put('/photos/{photo}', [PhotoController::class, 'update']);
    Route::get('/photos/{photo}/metadata', [PhotoController::class, 'metadata']);
    Route::delete('/photos/{photo}', [PhotoController::class, 'destroy']);

    Route::get('/ai/status', [AiController::class, 'status']);
    Route::post('/ai/chat', [AiController::class, 'chat']);
    Route::post('/ai/analyze', [AiController::class, 'analyze']);
    Route::post('/ai/preset', [AiController::class, 'preset']);
    Route::post('/ai/session-plan', [AiController::class, 'sessionPlan']);
    Route::post('/ai/recommend-gear', [AiController::class, 'recommendGear']);
    Route::get('/ai/history', [AiController::class, 'history']);
    Route::get('/ai/history/{conversation}', [AiController::class, 'showHistory']);
    Route::patch('/ai/history/{conversation}', [AiController::class, 'updateHistory']);
    Route::delete('/ai/history/{conversation}', [AiController::class, 'deleteHistory']);
    Route::post('/ai/analyze-photo', [AiController::class, 'analyzePhoto']);
    Route::post('/ai/assistant', [AiController::class, 'assistant']);

    // Fase 9: workflow enterprise
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('reminders', ReminderController::class);

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
