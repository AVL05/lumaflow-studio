<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AiAnalyzeRequest;
use App\Http\Requests\AiChatRequest;
use App\Http\Requests\AiGearRecommendationRequest;
use App\Http\Requests\AiHistoryRequest;
use App\Http\Requests\AiPresetRequest;
use App\Http\Requests\AiSessionPlanRequest;
use App\Http\Resources\AiAnalysisResource;
use App\Http\Resources\AiConversationResource;
use App\Http\Resources\AiSessionPlanResource;
use App\Http\Resources\PresetResource;
use App\Models\AiConversation;
use App\Models\Photo;
use App\Models\Session;
use App\Services\ActivityLogger;
use App\Services\AiContextService;
use App\Services\OllamaService;
use App\Services\PhotoAnalysisService;
use App\Services\PresetGeneratorService;
use App\Services\PromptBuilderService;
use App\Services\RecommendationService;
use App\Services\SessionPlannerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;

class AiController extends Controller
{
    public function __construct(
        private readonly OllamaService $ollama,
        private readonly AiContextService $context,
        private readonly PromptBuilderService $prompts,
        private readonly PhotoAnalysisService $analysis,
        private readonly PresetGeneratorService $presets,
        private readonly RecommendationService $recommendations,
        private readonly SessionPlannerService $sessionPlanner,
        private readonly ActivityLogger $activity,
    ) {}

    public function status(): JsonResponse
    {
        return response()->json($this->ollama->status() + [
            'streaming_supported' => $this->ollama->streamingAvailable(),
        ]);
    }

    public function chat(AiChatRequest $request): JsonResponse
    {
        $conversation = $this->conversation($request);
        $message = $request->validated('message');
        $history = $conversation->messages()
            ->latest()
            ->limit(12)
            ->get()
            ->reverse()
            ->map(fn ($item) => ['role' => $item->role, 'content' => $item->content])
            ->values()
            ->all();

        $conversation->messages()->create([
            'user_id' => $request->user()->id,
            'role' => 'user',
            'content' => $message,
            'metadata' => ['source' => 'ai_chat'],
        ]);

        try {
            $response = $this->ollama->chat($this->prompts->chat(
                $this->context->forUser($request->user(), ['conversation_id' => $conversation->id]),
                $message,
                $history
            ));
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        }

        $answer = $response['message']['content'] ?? '';
        $assistantMessage = $conversation->messages()->create([
            'user_id' => $request->user()->id,
            'role' => 'assistant',
            'content' => $answer,
            'metadata' => ['model' => config('ollama.model'), 'provider' => 'ollama'],
        ]);
        $conversation->update(['last_message_at' => now()]);

        return response()->json([
            'answer' => $answer,
            'conversation' => new AiConversationResource($conversation->fresh('messages')),
            'message' => $assistantMessage,
            'model' => config('ollama.model'),
            'provider' => 'ollama',
            'streaming_supported' => $this->ollama->streamingAvailable(),
        ]);
    }

    public function analyze(AiAnalyzeRequest $request): AiAnalysisResource|JsonResponse
    {
        $photo = Photo::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($request->integer('photo_id'));

        try {
            $analysis = $this->analysis->analyze(
                $request->user(),
                $photo,
                $request->validated('prompt') ?? null
            );
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        }

        $this->activity->log(
            $request->user(),
            $photo->session ?? $photo,
            ActivityLogger::AI_ANALYSIS,
            'Analisis IA de foto',
            ['photo_id' => $photo->id],
        );

        return new AiAnalysisResource($analysis);
    }

    public function preset(AiPresetRequest $request): PresetResource|JsonResponse
    {
        try {
            return new PresetResource($this->presets->generate($request->user(), $request->validated()));
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        }
    }

    public function sessionPlan(AiSessionPlanRequest $request): AiSessionPlanResource|JsonResponse
    {
        $session = Session::query()
            ->ownedBy($request->user()->id)
            ->findOrFail($request->integer('session_id'));

        try {
            $plan = $this->sessionPlanner->plan($request->user(), $session, $request->validated());
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        }

        $this->activity->log($request->user(), $session, ActivityLogger::AI_PLAN, 'Plan de sesion generado con IA');

        return new AiSessionPlanResource($plan);
    }

    public function recommendGear(AiGearRecommendationRequest $request): AiAnalysisResource|JsonResponse
    {
        try {
            return new AiAnalysisResource($this->recommendations->recommendGear($request->user(), $request->validated()));
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        }
    }

    public function history(): AnonymousResourceCollection
    {
        return AiConversationResource::collection(
            AiConversation::query()
                ->ownedBy(request()->user()->id)
                ->search(request('search'))
                ->withCount('messages')
                ->orderByDesc('last_message_at')
                ->orderByDesc('created_at')
                ->paginate(min((int) request('per_page', 20), 50))
        );
    }

    public function showHistory(AiConversation $conversation): AiConversationResource
    {
        $this->ensureConversationOwnership($conversation);

        return new AiConversationResource($conversation->load('messages'));
    }

    public function updateHistory(AiHistoryRequest $request, AiConversation $conversation): AiConversationResource
    {
        $this->ensureConversationOwnership($conversation);
        $conversation->update($request->validated());

        return new AiConversationResource($conversation->refresh());
    }

    public function deleteHistory(AiConversation $conversation): mixed
    {
        $this->ensureConversationOwnership($conversation);
        $conversation->delete();

        return response()->noContent();
    }

    private function conversation(AiChatRequest $request): AiConversation
    {
        if ($request->filled('conversation_id')) {
            return AiConversation::query()
                ->ownedBy($request->user()->id)
                ->findOrFail($request->integer('conversation_id'));
        }

        return $request->user()->aiConversations()->create([
            'title' => str($request->validated('message'))->limit(60)->toString(),
            'last_message_at' => now(),
        ]);
    }

    private function ensureConversationOwnership(AiConversation $conversation): void
    {
        abort_unless($conversation->user_id === request()->user()->id, 404);
    }
}
