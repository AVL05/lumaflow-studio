<?php

namespace Tests\Feature;

use App\Support\AuditLog;
use Illuminate\Contracts\Debug\ExceptionHandler;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AuditLogPrivacyTest extends TestCase
{
    public function test_production_refuses_log_mailer_and_failover_before_writing_email_content(): void
    {
        $file = tempnam(sys_get_temp_dir(), 'lf-mail-log-');
        config(['logging.channels.mail_privacy_test' => ['driver' => 'single', 'path' => $file], 'mail.mailers.log.channel' => 'mail_privacy_test']);
        $this->app->instance('env', 'production');
        try {
            foreach (['log', 'failover'] as $mailer) {
                try {
                    Mail::mailer($mailer)->raw('PRIVATE_MAIL_CANARY', fn ($message) => $message->to('synthetic@example.test')->subject('Synthetic'));
                    $this->fail('Production must refuse an email logger.');
                } catch (\RuntimeException $exception) {
                    $this->assertSame('The log mail transport is disabled in production. Configure SMTP.', $exception->getMessage());
                }
            }
            $this->assertStringNotContainsString('PRIVATE_MAIL_CANARY', file_get_contents($file));
        } finally {
            $this->app->instance('env', 'testing');
            Log::forgetChannel('mail_privacy_test');
            unlink($file);
        }
    }

    public function test_real_log_files_do_not_contain_exception_mail_or_private_url_canaries(): void
    {
        $file = tempnam(sys_get_temp_dir(), 'lf-log-');
        config(['logging.default' => 'single', 'logging.channels.single' => ['driver' => 'single', 'path' => $file], 'logging.channels.lumaflow' => ['driver' => 'single', 'path' => $file]]);
        Log::forgetChannel();
        try {
            $exception = new \RuntimeException('synthetic-private@example.test password=PASSWORD_CANARY token=TOKEN_CANARY payload=PAYLOAD_CANARY');
            AuditLog::apiException($exception, 'GET', 'api/public/deliveries/PATH_CANARY?signature=SIGNATURE_CANARY', 7, 'safe-request-reference');
            AuditLog::mailFailed('delivery-ready', $exception->getMessage(), 7);
            app(ExceptionHandler::class)->report($exception);
            $contents = file_get_contents($file);
            foreach (['synthetic-private@example.test', 'PASSWORD_CANARY', 'TOKEN_CANARY', 'PAYLOAD_CANARY', 'PATH_CANARY', 'SIGNATURE_CANARY'] as $canary) {
                $this->assertStringNotContainsString($canary, $contents);
            }
            $this->assertStringContainsString('RuntimeException', $contents);
            $this->assertStringContainsString('safe-request-reference', $contents);
            $this->assertStringContainsString('api.exception', $contents);
            $this->assertStringContainsString('mail.failed', $contents);
        } finally {
            Log::forgetChannel();
            unlink($file);
        }
    }
}
