<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AiAnalyzeRequest;
use App\Http\Requests\AiAssistantRequest;
use App\Http\Requests\AiChatRequest;
use App\Http\Resources\AiAnalysisResource;
use App\Models\Photo;
use App\Services\OllamaService;
use App\Services\PhotoAnalysisService;
use App\Services\RecommendationService;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class AiController extends Controller
{
    public function __construct(
        private readonly OllamaService $ollama,
        private readonly RecommendationService $recommendations,
        private readonly PhotoAnalysisService $analysis,
    ) {}

    public function status(): JsonResponse
    {
        return response()->json($this->ollama->status());
    }

    public function chat(AiChatRequest $request): JsonResponse
    {
        try {
            $response = $this->ollama->chat($this->messagesFor(
                $request->user(),
                $request->validated('message'),
                $request->input('history', [])
            ));
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        }

        return response()->json([
            'answer' => $response['message']['content'] ?? '',
            'model' => config('services.ollama.model'),
            'provider' => 'ollama',
        ]);
    }

    public function analyze(AiAnalyzeRequest $request): AiAnalysisResource|JsonResponse
    {
        $photo = Photo::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($request->integer('photo_id'));

        try {
            return new AiAnalysisResource($this->analysis->analyze(
                $request->user(),
                $photo,
                $request->validated('prompt') ?? null
            ));
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        }
    }

    public function analyzePhoto(AiAssistantRequest $request): AiAnalysisResource|JsonResponse
    {
        $photo = $request->filled('photo_id')
            ? Photo::query()->where('user_id', $request->user()->id)->findOrFail($request->integer('photo_id'))
            : null;

        abort_unless($photo, 422, 'photo_id requerido.');

        try {
            return new AiAnalysisResource($this->analysis->analyze($request->user(), $photo, $request->validated('prompt')));
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        }
    }

    public function assistant(AiAssistantRequest $request): JsonResponse
    {
        try {
            $response = $this->ollama->chat($this->messagesFor(
                $request->user(),
                $request->validated('prompt'),
                []
            ));
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        }

        return response()->json([
            'answer' => $response['message']['content'] ?? '',
            'model' => config('services.ollama.model'),
            'provider' => 'ollama',
        ]);
    }

    private function messagesFor($user, string $message, array $history): array
    {
        return [
            ['role' => 'system', 'content' => $this->recommendations->systemPrompt()],
            ['role' => 'user', 'content' => json_encode([
                'context' => $this->recommendations->contextFor($user),
                'history' => $history,
                'message' => $message,
            ], JSON_UNESCAPED_UNICODE)],
        ];
    }
}
