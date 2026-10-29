<?php

namespace Tests\Feature;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class ServerLogPrivacyTest extends TestCase
{
    public function test_http_server_redacts_private_routes_and_queries_before_logging(): void
    {
        $socket = stream_socket_server('tcp://127.0.0.1:0', $error, $message);
        $address = stream_socket_get_name($socket, false);
        fclose($socket);
        $server = new Process([PHP_BINARY, '-S', $address, '-t', public_path(), base_path('server.php')], public_path(), ['APP_ENV' => 'testing', 'APP_DEBUG' => 'false', 'SENTRY_LARAVEL_DSN' => '', 'LOG_CHANNEL' => 'null']);
        $server->start();
        try {
            $deadline = microtime(true) + 10;
            do {
                try {
                    $response = Http::timeout(1)->get('http://'.$address.'/api/public/contracts/PATH_CANARY/not-a-route?signature=QUERY_CANARY');
                    break;
                } catch (ConnectionException) {
                    usleep(10000);
                }
            } while (microtime(true) < $deadline);
            $this->assertSame(404, $response->status());
            $server->stop();
            $output = $server->getOutput().$server->getErrorOutput();
            $this->assertStringNotContainsString('PATH_CANARY', $output);
            $this->assertStringNotContainsString('QUERY_CANARY', $output);
            $this->assertStringContainsString('GET', $output);
            $this->assertStringContainsString('[REDACTED]', $output);
        } finally {
            $server->stop();
        }
    }
}
