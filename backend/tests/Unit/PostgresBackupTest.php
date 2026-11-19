<?php

namespace Tests\Unit;

use App\Services\DataBackupService;
use PHPUnit\Framework\TestCase;
use RuntimeException;

class PostgresBackupTest extends TestCase
{
    private function config(array $extra = []): array
    {
        return $extra + [
            'host' => 'pooler.example.test',
            'port' => '5432',
            'username' => 'lumaflow_app.ref',
            'password' => 's3cret',
            'database' => 'postgres',
            'search_path' => 'lumaflow',
            'sslmode' => 'require',
        ];
    }

    public function test_pg_dump_is_limited_to_the_app_schema_without_secrets_in_argv(): void
    {
        $command = DataBackupService::buildPgDumpCommand($this->config());

        $this->assertSame('pg_dump', $command[0]);
        $this->assertContains('--schema=lumaflow', $command);
        $this->assertContains('--no-owner', $command);
        $this->assertContains('--no-privileges', $command);
        $this->assertStringNotContainsString('s3cret', implode(' ', $command));
    }

    public function test_public_search_path_dumps_the_whole_database(): void
    {
        $command = DataBackupService::buildPgDumpCommand($this->config(['search_path' => 'public']));

        $this->assertNull(DataBackupService::pgSchema($this->config(['search_path' => 'public'])));
        $this->assertSame([], array_values(array_filter($command, fn (string $arg) => str_starts_with($arg, '--schema='))));
    }

    public function test_password_and_tls_mode_travel_by_environment(): void
    {
        $env = DataBackupService::pgEnvironment($this->config());

        $this->assertSame('s3cret', $env['PGPASSWORD']);
        $this->assertSame('require', $env['PGSSLMODE']);
    }

    public function test_psql_import_stops_on_error_inside_a_transaction(): void
    {
        $command = DataBackupService::buildPsqlImportCommand($this->config());

        $this->assertSame('psql', $command[0]);
        $this->assertContains('--set=ON_ERROR_STOP=1', $command);
        $this->assertContains('--single-transaction', $command);
        $this->assertStringNotContainsString('s3cret', implode(' ', $command));
    }

    public function test_complete_dump_with_migrations_table_verifies(): void
    {
        $dump = "CREATE SCHEMA lumaflow;\nCREATE TABLE lumaflow.migrations (id integer);\nCREATE TABLE lumaflow.users (id integer);\n-- PostgreSQL database dump complete\n";

        $this->assertSame(['tables' => 2, 'users' => null], DataBackupService::verifyPostgresDump($dump));
    }

    public function test_truncated_or_incomplete_dumps_are_rejected(): void
    {
        $this->expectException(RuntimeException::class);

        DataBackupService::verifyPostgresDump("CREATE TABLE lumaflow.migrations (id integer);\n");
    }

    public function test_dump_without_migrations_table_is_rejected(): void
    {
        $this->expectExceptionMessage('falta la tabla migrations');

        DataBackupService::verifyPostgresDump("CREATE TABLE lumaflow.users (id integer);\n-- PostgreSQL database dump complete\n");
    }
}
