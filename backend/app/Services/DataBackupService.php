<?php

namespace App\Services;

use DateTimeImmutable;
use DateTimeInterface;
use Illuminate\Support\Facades\DB;
use Pdo\Mysql;
use RuntimeException;
use Symfony\Component\Process\Process;

/**
 * Backup y verificacion de la base de datos (Issue #12).
 *
 * La logica pura (nombres, retencion, checksum, construccion de comandos)
 * vive aqui para poder testearse sin binarios ni red. Los comandos
 * `data:backup` / `data:restore` orquestan el trabajo real.
 */
class DataBackupService
{
    public const BACKUP_PREFIX = 'lumaflow-db-';

    public const BACKUP_SUFFIX = '.sql.gz';

    public const DEFAULT_KEEP_DAILY = 7;

    public const DEFAULT_KEEP_WEEKLY = 4;

    /**
     * Nombre sin PII: lumaflow-db-20261005-120000-mysql.sql.gz
     */
    public static function filename(DateTimeInterface $at, string $driver): string
    {
        return self::BACKUP_PREFIX.$at->format('Ymd-His')."-{$driver}".self::BACKUP_SUFFIX;
    }

    /**
     * Solo archivos generados por data:backup. Se compara el basename con
     * patron exacto; el comando siempre resuelve dentro del directorio de
     * backups, asi que un traversal como /x/../nombre queda neutralizado
     * (apunta dentro, nunca fuera).
     */
    public static function isRecognizedBackup(string $path): bool
    {
        return (bool) preg_match(
            '/\Alumaflow-db-\d{8}-\d{6}-(mysql|mariadb|pgsql|sqlite)\.sql\.gz\z/',
            basename($path)
        );
    }

    public static function parseBackupDate(string $basename): ?DateTimeImmutable
    {
        if (! preg_match('/\Alumaflow-db-(\d{8})-(\d{6})-(?:mysql|mariadb|pgsql|sqlite)\.sql\.gz\z/', $basename, $match)) {
            return null;
        }

        $date = DateTimeImmutable::createFromFormat('Ymd-His', "{$match[1]}-{$match[2]}");

        return $date === false ? null : $date;
    }

    /**
     * Seleccion de retencion: conserva el mas nuevo por dia en los ultimos
     * $keepDaily dias distintos, mas el mas nuevo por semana ISO en
     * $keepWeekly semanas anteriores. Devuelve basenames a ELIMINAR.
     *
     * @param  string[]  $basenames
     * @return string[]
     */
    public static function selectForRetention(array $basenames, int $keepDaily, int $keepWeekly, ?DateTimeImmutable $now = null): array
    {
        $now ??= new DateTimeImmutable('today');

        $dated = [];
        foreach ($basenames as $name) {
            $date = self::parseBackupDate($name);

            if ($date instanceof DateTimeImmutable) {
                $dated[$name] = $date;
            }
        }

        uasort($dated, fn ($a, $b) => $b <=> $a);

        $keep = [];
        $days = [];
        $weeks = [];

        foreach ($dated as $name => $date) {
            $dayKey = $date->format('Y-m-d');
            $daysAgo = (int) $date->setTime(0, 0)->diff($now)->format('%a');

            if ($daysAgo < $keepDaily && ! isset($days[$dayKey])) {
                $days[$dayKey] = true;
                $keep[$name] = true;

                continue;
            }

            $weekKey = $date->format('o-\WW');
            if ($daysAgo >= $keepDaily && count($weeks) < $keepWeekly && ! isset($weeks[$weekKey])) {
                $weeks[$weekKey] = true;
                $keep[$name] = true;
            }
        }

        return array_values(array_diff(array_keys($dated), array_keys($keep)));
    }

    public static function sha256(string $path): string
    {
        $hash = hash_file('sha256', $path);

        if ($hash === false) {
            throw new RuntimeException("No se pudo calcular el checksum de {$path}.");
        }

        return $hash;
    }

    /**
     * Argv para mysqldump sin secretos: la password viaja por env
     * (MYSQL_PWD), nunca en argumentos visibles ni logs. Con CA
     * configurada (TiDB exige TLS) se pasa --ssl-ca.
     */
    public static function buildMysqlDumpCommand(array $config): array
    {
        return [
            'mysqldump',
            "--host={$config['host']}",
            "--port={$config['port']}",
            "--user={$config['username']}",
            ...self::mysqlTlsArgs($config),
            '--single-transaction',
            '--quick',
            '--routines',
            '--events',
            '--set-gtid-purged=OFF',
            $config['database'],
        ];
    }

    public static function buildMysqlImportCommand(array $config): array
    {
        return [
            'mysql',
            "--host={$config['host']}",
            "--port={$config['port']}",
            "--user={$config['username']}",
            ...self::mysqlTlsArgs($config),
            $config['database'],
        ];
    }

    /**
     * Atributo SSL CA sin avisos de deprecacion (PDO viejo o Pdo\Mysql nuevo).
     */
    public static function sslCaAttribute(): int|string|null
    {
        if (class_exists(Mysql::class)) {
            return Mysql::ATTR_SSL_CA;
        }

        return \defined('PDO::MYSQL_ATTR_SSL_CA') ? \PDO::MYSQL_ATTR_SSL_CA : null;
    }

    /**
     * @return string[]
     */
    public static function mysqlTlsArgs(array $config): array
    {
        $attr = self::sslCaAttribute();
        $ca = $attr === null ? null : ($config['options'][$attr] ?? null);

        if (! is_string($ca) || $ca === '') {
            return [];
        }

        return [
            "--ssl-ca={$ca}",
            ...(($config['driver'] ?? null) === 'mysql' ? ['--ssl-mode=VERIFY_IDENTITY'] : []),
        ];
    }

    public static function buildPgDumpCommand(array $config): array
    {
        return [
            'pg_dump',
            "--host={$config['host']}",
            "--port={$config['port']}",
            "--username={$config['username']}",
            '--format=plain',
            '--no-owner',
            $config['database'],
        ];
    }

    /**
     * Resolucion portable de ejecutables recorriendo PATH, sin shell.
     *
     * Evita builtins (`command -v` no es un ejecutable en Unix), quoting e
     * inyeccion: el nombre debe ser un basename simple. En Windows se
     * contemplan las extensiones de PATHEXT.
     */
    public static function findExecutable(string $binary, ?string $path = null, ?string $pathExt = null): ?string
    {
        if (! preg_match('/\A[a-zA-Z0-9][a-zA-Z0-9_.-]*\z/', $binary)) {
            return null;
        }

        $path ??= (string) getenv('PATH');
        $isWindows = DIRECTORY_SEPARATOR === '\\';
        $extensions = [''];

        // Las extensiones aplican en Windows o cuando se indican
        // explicitamente (asi la logica es testeable en cualquier SO).
        if ($isWindows || $pathExt !== null) {
            $pathExt ??= (string) getenv('PATHEXT');
            $seen = [];
            $extensions = [];

            foreach (explode(';', $pathExt === '' ? '.EXE' : $pathExt) as $ext) {
                $ext = trim($ext);

                if ($ext === '' || isset($seen[strtolower($ext)])) {
                    continue;
                }

                $seen[strtolower($ext)] = true;
                $extensions[] = $ext;
            }
            $extensions[] = '';
        }

        foreach (explode(PATH_SEPARATOR, $path) as $dir) {
            $dir = trim($dir, "\"' \t");

            if ($dir === '') {
                continue;
            }

            foreach ($extensions as $ext) {
                $candidate = $dir.DIRECTORY_SEPARATOR.$binary.$ext;

                if (is_file($candidate) && is_executable($candidate)) {
                    return $candidate;
                }
            }
        }

        return null;
    }

    public static function binaryAvailable(string $binary): bool
    {
        return self::findExecutable($binary) !== null;
    }

    public function backupDirectory(): string
    {
        $dir = (string) config('backup.path');

        if (! is_dir($dir)) {
            if (! mkdir($dir, 0700, true) && ! is_dir($dir)) {
                throw new RuntimeException('No se pudo crear el directorio privado de backups.');
            }
        }

        return $dir;
    }

    public function defaultDriver(): string
    {
        return (string) config('database.default');
    }

    /**
     * @return array{file: string, bytes: int, sha256: string, driver: string}
     */
    public function backup(?string $driver = null): array
    {
        $driver ??= $this->defaultDriver();
        $file = $this->backupDirectory().DIRECTORY_SEPARATOR.self::filename(new DateTimeImmutable, $driver);

        $sql = match ($driver) {
            'mysql', 'mariadb' => $this->dumpMysql($driver),
            'pgsql' => $this->dumpPostgres(),
            'sqlite' => $this->snapshotSqlite(),
            default => throw new RuntimeException("Motor no soportado para backup: {$driver}."),
        };

        file_put_contents($file, gzencode($sql, 9));
        $sha = self::sha256($file);
        file_put_contents("{$file}.sha256", "{$sha}  ".basename($file)."\n");

        return ['file' => $file, 'bytes' => filesize($file), 'sha256' => $sha, 'driver' => $driver];
    }

    /**
     * @return string[] Basenames de backups presentes (solo reconocidos).
     */
    public function listBackups(): array
    {
        // glob() no tolera separadores mixtos en Windows: normalizar.
        $pattern = str_replace(DIRECTORY_SEPARATOR, '/', $this->backupDirectory().'/'.self::BACKUP_PREFIX.'*'.self::BACKUP_SUFFIX);
        $found = [];

        foreach (glob($pattern) ?: [] as $path) {
            if (self::isRecognizedBackup($path)) {
                $found[] = basename($path);
            }
        }

        return $found;
    }

    /**
     * @return array{deleted: string[], kept: string[]}
     */
    public function prune(int $keepDaily, int $keepWeekly, bool $dryRun = false): array
    {
        $dir = $this->backupDirectory();
        $candidates = $this->listBackups();

        $toDelete = self::selectForRetention($candidates, $keepDaily, $keepWeekly);

        if (! $dryRun) {
            foreach ($toDelete as $name) {
                @unlink("{$dir}/{$name}");
                @unlink("{$dir}/{$name}.sha256");
            }
        }

        return ['deleted' => $toDelete, 'kept' => array_values(array_diff($candidates, $toDelete))];
    }

    private function dumpMysql(string $driver): string
    {
        if (! self::binaryAvailable('mysqldump')) {
            throw new RuntimeException('Falta mysqldump. Instale MySQL client para respaldar este motor.');
        }

        $config = config("database.connections.{$driver}");
        $this->assertTlsCa($config);
        $process = new Process(self::buildMysqlDumpCommand($config), null, [
            'MYSQL_PWD' => (string) ($config['password'] ?? ''),
        ]);
        $process->setTimeout(600);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException('mysqldump fallo. Revise credenciales y conectividad (sin exponer secretos).');
        }

        return $process->getOutput();
    }

    private function dumpPostgres(): string
    {
        if (! self::binaryAvailable('pg_dump')) {
            throw new RuntimeException('Falta pg_dump. Instale PostgreSQL client para respaldar este motor.');
        }

        $config = config('database.connections.pgsql');
        $process = new Process(self::buildPgDumpCommand($config), null, [
            'PGPASSWORD' => (string) ($config['password'] ?? ''),
        ]);
        $process->setTimeout(600);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException('pg_dump fallo. Revise credenciales y conectividad (sin exponer secretos).');
        }

        return $process->getOutput();
    }

    private function assertTlsCa(array $config): void
    {
        foreach (self::mysqlTlsArgs($config) as $arg) {
            if (! str_starts_with($arg, '--ssl-ca=')) {
                continue;
            }
            $ca = substr($arg, strlen('--ssl-ca='));

            if (! is_file($ca)) {
                throw new RuntimeException('CA TLS configurada pero ilegible. Revise MYSQL_ATTR_SSL_CA sin exponer secretos.');
            }
        }
    }

    private function snapshotSqlite(): string
    {
        $config = config('database.connections.sqlite');
        $source = (string) ($config['database'] ?? '');

        if ($source === '' || $source === ':memory:' || ! is_file($source)) {
            throw new RuntimeException('SQLite sin archivo: no hay nada que respaldar en memoria.');
        }

        $snapshot = tempnam(sys_get_temp_dir(), 'lumaflow-sqlite-');

        try {
            // VACUUM INTO genera un snapshot consistente aunque haya lecturas.
            DB::connection('sqlite')->getPdo()->exec("VACUUM INTO '{$snapshot}'");
            $sql = $this->sqliteDump($snapshot);
        } finally {
            @unlink($snapshot);
        }

        return $sql;
    }

    /**
     * Dump SQL portable de un SQLite leyendo schema + datos via PDO.
     */
    public function sqliteDump(string $file): string
    {
        $pdo = new \PDO("sqlite:{$file}", null, null, [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]);
        $out = ['PRAGMA foreign_keys=OFF;'];

        $tables = $pdo->query(
            "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        )->fetchAll(\PDO::FETCH_ASSOC);

        foreach ($tables as $table) {
            $out[] = $table['sql'].';';
        }

        foreach ($tables as $table) {
            $name = str_replace('"', '""', $table['name']);
            $columns = $pdo->query("PRAGMA table_info(\"{$name}\")")->fetchAll(\PDO::FETCH_ASSOC);

            foreach ($pdo->query("SELECT * FROM \"{$name}\"") as $row) {
                $values = [];
                foreach ($columns as $column) {
                    $value = $row[$column['name']];

                    if ($value === null) {
                        $values[] = 'NULL';
                    } elseif (is_int($value) || is_float($value)) {
                        $values[] = (string) $value;
                    } else {
                        $values[] = $pdo->quote((string) $value);
                    }
                }

                $out[] = "INSERT INTO \"{$name}\" VALUES (".implode(', ', $values).');';
            }
        }

        $out[] = 'PRAGMA foreign_keys=ON;';

        return implode("\n", $out)."\n";
    }

    /**
     * Verifica un backup restaurandolo en un destino temporal aislado.
     *
     * @return array{tables: int, users: int|null}
     */
    public function verifyBackup(string $file, string $driver): array
    {
        $sql = $this->readBackupSql($file);

        if ($driver === 'sqlite') {
            $tmp = tempnam(sys_get_temp_dir(), 'lumaflow-verify-').'.sqlite';
            file_put_contents($tmp, '');

            try {
                $pdo = new \PDO("sqlite:{$tmp}", null, null, [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]);
                $pdo->exec($sql);

                return $this->verifySqlite($pdo);
            } finally {
                @unlink($tmp);
            }
        }

        $config = config("database.connections.{$driver}");
        $tmpDb = ($config['database'] ?? 'lumaflow').'__verify_'.date('YmdHis');

        $this->mysqlExec($config, "CREATE DATABASE `{$tmpDb}`");
        try {
            $this->mysqlImport($config, $tmpDb, $sql);

            return $this->verifyMysql($config, $tmpDb);
        } finally {
            $this->mysqlExec($config, "DROP DATABASE IF EXISTS `{$tmpDb}`");
        }
    }

    public function readBackupSql(string $file): string
    {
        $raw = file_get_contents($file);

        if ($raw === false) {
            throw new RuntimeException("No se pudo leer {$file}.");
        }

        $sql = @gzdecode($raw);

        if ($sql === false) {
            throw new RuntimeException("Backup ilegible o corrupto: {$file}.");
        }

        return $sql;
    }

    public function verifyChecksum(string $file): bool
    {
        $sidecar = "{$file}.sha256";

        if (! is_file($sidecar)) {
            return false;
        }

        $expected = explode(' ', trim((string) file_get_contents($sidecar)))[0] ?? '';

        return hash_equals($expected, self::sha256($file));
    }

    private function verifySqlite(\PDO $pdo): array
    {
        $tables = $pdo->query(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
        )->fetchColumn();

        $users = null;
        $names = $pdo->query("SELECT name FROM sqlite_master WHERE type = 'table'")->fetchAll(\PDO::FETCH_COLUMN);

        if (! in_array('migrations', array_map('strval', $names), true)) {
            throw new RuntimeException('Verificacion fallida: falta la tabla migrations.');
        }

        if (in_array('users', array_map('strval', $names), true)) {
            $users = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
        }

        return ['tables' => (int) $tables, 'users' => $users];
    }

    private function verifyMysql(array $config, string $database): array
    {
        $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$database}";
        $pdo = new \PDO($dsn, $config['username'], $config['password'] ?? '', [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]);

        $tables = (int) $pdo->query(
            'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()'
        )->fetchColumn();

        $migrations = (int) $pdo->query(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'migrations'"
        )->fetchColumn();

        if ($migrations === 0) {
            throw new RuntimeException('Verificacion fallida: falta la tabla migrations.');
        }

        return ['tables' => $tables, 'users' => null];
    }

    private function mysqlExec(array $config, string $sql): void
    {
        $dsn = "mysql:host={$config['host']};port={$config['port']}";
        $pdo = new \PDO($dsn, $config['username'], $config['password'] ?? '', [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]);
        $pdo->exec($sql);
    }

    private function mysqlImport(array $config, string $database, string $sql): void
    {
        if (! self::binaryAvailable('mysql')) {
            throw new RuntimeException('Falta el cliente mysql. Instale MySQL client para restaurar este motor.');
        }

        $this->assertTlsCa($config);

        $process = new Process(
            [...self::buildMysqlImportCommand([...$config, 'database' => $database])],
            null,
            ['MYSQL_PWD' => (string) ($config['password'] ?? '')]
        );
        $process->setTimeout(600);
        $process->setInput($sql);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException('Importacion de verificacion fallida.');
        }
    }

    public function applySqlite(string $file, string $target): void
    {
        $sql = $this->readBackupSql($file);
        $tmp = tempnam(sys_get_temp_dir(), 'lumaflow-apply-').'.sqlite';
        file_put_contents($tmp, '');

        $pdo = new \PDO("sqlite:{$tmp}", null, null, [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]);
        $pdo->exec($sql);
        $pdo = null;

        rename($tmp, $target);
    }

    public function applyMysql(string $file, string $driver): void
    {
        $config = config("database.connections.{$driver}");
        $this->mysqlImport($config, (string) $config['database'], $this->readBackupSql($file));
    }
}
