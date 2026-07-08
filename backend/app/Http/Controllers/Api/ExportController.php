<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExportRequest;
use App\Services\ExportService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function __invoke(ExportRequest $request, ExportService $exports, string $resource): StreamedResponse|JsonResponse
    {
        return $exports->export(
            $request->user(),
            $resource,
            $request->validated('format'),
            $request->validated('ids', []),
        );
    }
}
