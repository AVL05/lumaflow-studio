<?php

use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\AlbumController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DeliveryController;
use App\Http\Controllers\Api\GearItemController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\PhotoController;
use App\Http\Controllers\Api\PresetController;
use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\TagController;
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
    Route::post('/ai/analyze-photo', [AiController::class, 'analyzePhoto']);
    Route::post('/ai/assistant', [AiController::class, 'assistant']);
});
