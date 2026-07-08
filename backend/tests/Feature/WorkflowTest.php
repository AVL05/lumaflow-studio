<?php

namespace Tests\Feature;

use App\Models\Checklist;
use App\Models\Client;
use App\Models\Delivery;
use App\Models\Notification;
use App\Models\Reminder;
use App\Models\Session;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_task_crud_marks_completion_timestamp(): void
    {
        $created = $this->postJson('/api/tasks', [
            'title' => 'Revisar seleccion',
            'priority' => 'high',
            'status' => 'todo',
            'due_date' => now()->addDay()->toDateString(),
        ])->assertCreated()->json('data');

        $this->assertNull($created['completed_at']);

        $updated = $this->putJson("/api/tasks/{$created['id']}", [
            'title' => 'Revisar seleccion',
            'priority' => 'high',
            'status' => 'completed',
        ])->assertOk()->json('data');

        $this->assertNotNull($updated['completed_at']);
        $this->assertDatabaseHas('notifications', ['user_id' => $this->user->id, 'title' => 'Tarea completada']);

        $this->deleteJson("/api/tasks/{$created['id']}")->assertNoContent();
    }

    public function test_tasks_of_other_users_are_not_reachable(): void
    {
        $foreign = Task::create([
            'user_id' => User::factory()->create()->id,
            'title' => 'Ajena',
            'priority' => 'low',
            'status' => 'todo',
        ]);

        $this->getJson("/api/tasks/{$foreign->id}")->assertNotFound();
        $this->deleteJson("/api/tasks/{$foreign->id}")->assertNotFound();
    }

    public function test_checklist_is_created_from_template_and_can_be_duplicated(): void
    {
        $session = $this->makeSession();

        $checklist = $this->postJson('/api/checklists', [
            'session_id' => $session->id,
            'name' => 'Equipo',
            'type' => 'gear',
            'use_template' => true,
        ])->assertCreated()->json('data');

        $this->assertGreaterThan(0, $checklist['items_count']);
        $this->assertSame(0, $checklist['progress']);

        $item = $checklist['items'][0];
        $this->patchJson("/api/checklist-items/{$item['id']}/toggle", ['is_completed' => true])
            ->assertOk()
            ->assertJsonPath('data.is_completed', true);

        $refreshed = $this->getJson("/api/checklists/{$checklist['id']}")->assertOk()->json('data');
        $this->assertGreaterThan(0, $refreshed['progress']);

        $copy = $this->postJson("/api/checklists/{$checklist['id']}/duplicate")->assertCreated()->json('data');
        $this->assertSame(0, $copy['progress']);
        $this->assertSame($checklist['items_count'], $copy['items_count']);
    }

    public function test_checklist_reorder_updates_positions(): void
    {
        $checklist = Checklist::create(['user_id' => $this->user->id, 'name' => 'Custom', 'type' => 'custom']);
        $first = $checklist->items()->create(['title' => 'A', 'position' => 0]);
        $second = $checklist->items()->create(['title' => 'B', 'position' => 1]);

        $this->putJson("/api/checklists/{$checklist->id}/reorder", ['items' => [$second->id, $first->id]])->assertOk();

        $this->assertSame(0, $second->refresh()->position);
        $this->assertSame(1, $first->refresh()->position);
    }

    public function test_reminder_rejects_foreign_subject(): void
    {
        $foreignSession = Session::create([
            'user_id' => User::factory()->create()->id,
            'name' => 'Ajena',
            'date' => now()->toDateString(),
            'session_type' => 'portrait',
            'status' => 'planned',
        ]);

        $this->postJson('/api/reminders', [
            'remind_date' => now()->toDateString(),
            'message' => 'Prueba',
            'type' => 'session',
            'remindable_type' => 'session',
            'remindable_id' => $foreignSession->id,
        ])->assertStatus(422)->assertJsonValidationErrors('remindable_id');
    }

    public function test_calendar_returns_events_and_moves_them(): void
    {
        $session = $this->makeSession(now()->addDays(2)->toDateString());

        $events = $this->getJson('/api/calendar?from='.now()->toDateString().'&to='.now()->addWeek()->toDateString())
            ->assertOk()
            ->json('data');

        $this->assertSame("session-{$session->id}", $events[0]['id']);

        $target = now()->addDays(4)->toDateString();
        $this->patchJson('/api/calendar/move', [
            'source' => 'session',
            'source_id' => $session->id,
            'date' => $target,
            'time' => '09:30',
        ])->assertOk();

        $this->assertSame($target, $session->refresh()->date->toDateString());
        $this->assertDatabaseHas('activities', ['subject_id' => $session->id, 'type' => 'updated']);
    }

    public function test_global_search_groups_results(): void
    {
        $this->makeSession(name: 'Editorial nocturno');
        Client::create(['user_id' => $this->user->id, 'name' => 'Editorial Studio', 'status' => 'active']);

        $response = $this->getJson('/api/search?q=editorial')->assertOk()->json();

        $this->assertSame(2, $response['total']);
        $this->assertEqualsCanonicalizing(['sessions', 'clients'], array_column($response['groups'], 'group'));
    }

    public function test_session_timeline_records_status_changes(): void
    {
        $session = $this->makeSession();

        $this->putJson("/api/sessions/{$session->id}", [
            'name' => $session->name,
            'date' => $session->date->toDateString(),
            'session_type' => 'portrait',
            'status' => 'delivered',
        ])->assertOk();

        $timeline = $this->getJson("/api/sessions/{$session->id}/timeline")->assertOk()->json('data');

        $this->assertEqualsCanonicalizing(
            ['status_changed', 'delivered'],
            array_column($timeline, 'type'),
        );
    }

    public function test_deleting_a_subject_removes_its_activities_and_reminders(): void
    {
        $session = $this->makeSession();
        $this->putJson("/api/sessions/{$session->id}", [
            'name' => $session->name,
            'date' => $session->date->toDateString(),
            'session_type' => 'portrait',
            'status' => 'completed',
        ])->assertOk();

        $this->postJson('/api/reminders', [
            'remind_date' => now()->toDateString(),
            'message' => 'Recordatorio ligado',
            'type' => 'session',
            'remindable_type' => 'session',
            'remindable_id' => $session->id,
        ])->assertCreated();

        $this->assertDatabaseCount('activities', 1);
        $this->assertDatabaseCount('reminders', 1);

        $this->deleteJson("/api/sessions/{$session->id}")->assertNoContent();

        $this->assertDatabaseCount('activities', 0);
        $this->assertDatabaseCount('reminders', 0);
    }

    public function test_bulk_delete_also_cleans_morph_relations(): void
    {
        $task = Task::create(['user_id' => $this->user->id, 'title' => 'Con rastro', 'priority' => 'low', 'status' => 'todo']);
        $task->activities()->create(['user_id' => $this->user->id, 'type' => 'created', 'description' => 'x']);

        $this->postJson('/api/bulk-actions', [
            'resource' => 'tasks',
            'action' => 'delete',
            'ids' => [$task->id],
        ])->assertOk()->assertJson(['affected' => 1]);

        $this->assertDatabaseCount('activities', 0);
    }

    public function test_notifications_can_be_read_and_cleared(): void
    {
        Notification::create(['user_id' => $this->user->id, 'type' => 'info', 'title' => 'Hola']);
        Notification::create(['user_id' => $this->user->id, 'type' => 'warning', 'title' => 'Ojo']);

        $this->getJson('/api/notifications/unread-count')->assertOk()->assertJson(['unread' => 2]);
        $this->patchJson('/api/notifications/read-all')->assertOk()->assertJson(['unread' => 0]);
        $this->deleteJson('/api/notifications/clear?only=read')->assertOk()->assertJson(['deleted' => 2]);
    }

    public function test_bulk_action_changes_status_only_for_owned_records(): void
    {
        $mine = $this->makeSession();
        $foreign = Session::create([
            'user_id' => User::factory()->create()->id,
            'name' => 'Ajena',
            'date' => now()->toDateString(),
            'session_type' => 'portrait',
            'status' => 'planned',
        ]);

        $this->postJson('/api/bulk-actions', [
            'resource' => 'sessions',
            'action' => 'status',
            'ids' => [$mine->id, $foreign->id],
            'value' => 'completed',
        ])->assertOk()->assertJson(['affected' => 1]);

        $this->assertSame('completed', $mine->refresh()->status);
        $this->assertSame('planned', $foreign->refresh()->status);
    }

    public function test_bulk_action_rejects_unsupported_combination(): void
    {
        $this->postJson('/api/bulk-actions', [
            'resource' => 'gear',
            'action' => 'status',
            'ids' => [1],
            'value' => 'active',
        ])->assertStatus(422);
    }

    public function test_csv_export_streams_owned_rows(): void
    {
        $this->makeSession(name: 'Exportable');

        $response = $this->get('/api/exports/sessions?format=csv')->assertOk();
        $content = $response->streamedContent();

        $this->assertStringContainsString('Exportable', $content);
        $this->assertStringContainsString('session_type', $content);
    }

    public function test_json_export_returns_structured_payload(): void
    {
        $this->makeSession(name: 'Exportable');

        $this->getJson('/api/exports/sessions?format=json')
            ->assertOk()
            ->assertJsonPath('resource', 'sessions')
            ->assertJsonPath('data.0.name', 'Exportable');
    }

    public function test_dashboard_exposes_workflow_widgets(): void
    {
        Task::create(['user_id' => $this->user->id, 'title' => 'Pendiente', 'priority' => 'high', 'status' => 'todo']);
        Reminder::create(['user_id' => $this->user->id, 'remind_date' => now()->addDay(), 'message' => 'Ping', 'type' => 'custom']);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('data.taskSummary.open', 1)
            ->assertJsonCount(1, 'data.pendingTasks')
            ->assertJsonCount(1, 'data.upcomingReminders')
            ->assertJsonStructure(['data' => ['monthlyProgress', 'todayAgenda', 'unreadNotifications', 'timeline']]);
    }

    public function test_delivery_status_change_notifies_and_logs_timeline(): void
    {
        $session = $this->makeSession();
        $client = Client::create(['user_id' => $this->user->id, 'name' => 'Marca', 'status' => 'active']);
        $delivery = Delivery::create([
            'user_id' => $this->user->id,
            'client_id' => $client->id,
            'session_id' => $session->id,
            'title' => 'Entrega',
            'status' => 'pending',
        ]);

        $this->putJson("/api/deliveries/{$delivery->id}", [
            'client_id' => $client->id,
            'session_id' => $session->id,
            'title' => 'Entrega',
            'status' => 'delivered',
        ])->assertOk();

        $this->assertDatabaseHas('notifications', ['user_id' => $this->user->id, 'title' => 'Entrega actualizada']);
        $this->assertDatabaseHas('activities', ['subject_id' => $session->id, 'type' => 'delivered']);
    }

    private function makeSession(?string $date = null, string $name = 'Sesion test'): Session
    {
        return Session::create([
            'user_id' => $this->user->id,
            'name' => $name,
            'date' => $date ?? now()->toDateString(),
            'session_type' => 'portrait',
            'status' => 'planned',
        ]);
    }
}
