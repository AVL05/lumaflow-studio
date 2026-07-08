<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SearchRequest;
use App\Services\SearchService;
use Illuminate\Http\JsonResponse;

class SearchController extends Controller
{
    public function __invoke(SearchRequest $request, SearchService $search): JsonResponse
    {
        return response()->json($search->search(
            $request->user(),
            $request->validated('q'),
            $request->validated('groups', []),
            (int) $request->validated('per_group', 5),
        ));
    }
}
