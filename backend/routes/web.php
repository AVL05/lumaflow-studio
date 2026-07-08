<?php

use Illuminate\Support\Facades\Route;

/*
 * El backend es una API pura: la SPA de React vive en frontend/ y se sirve
 * aparte. La raiz solo publica metadatos y punteros utiles.
 */
Route::get('/', fn () => response()->json([
    'name' => config('app.name'),
    'api' => url('/api'),
    'health' => url('/api/health'),
    'docs' => 'https://github.com/AVL05/lumaflow-studio/tree/main/docs',
]));
