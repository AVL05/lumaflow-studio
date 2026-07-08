<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BulkActionRequest;
use App\Services\BulkActionService;
use Illuminate\Http\JsonResponse;

class BulkActionController extends Controller
{
    public function __invoke(BulkActionRequest $request, BulkActionService $bulk): JsonResponse
    {
        $affected = $bulk->run(
            $request->user(),
            $request->validated('resource'),
            $request->validated('action'),
            $request->validated('ids'),
            $request->safe()->only(['value', 'tag_ids', 'album_id', 'client_id']),
        );

        return response()->json([
            'resource' => $request->validated('resource'),
            'action' => $request->validated('action'),
            'affected' => $affected,
        ]);
    }
}
