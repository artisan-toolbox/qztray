<?php

declare(strict_types=1);

use Illuminate\Filesystem\Filesystem;
use Symfony\Component\Finder\Finder;
use Symfony\Component\Process\Process;

$root = dirname(__DIR__, 2);

require $root.'/vendor/autoload.php';

$filesystem = new Filesystem;
$temporary = sys_get_temp_dir().'/qztray-types-'.bin2hex(random_bytes(16));

throw_unless($filesystem->makeDirectory($temporary, 0700), RuntimeException::class, 'Could not create a temporary directory for type coverage.');

$report = $temporary.'/coverage.json';
$exitCode = 0;

try {
    $pest = new Process([
        PHP_BINARY,
        '-d',
        'sys_temp_dir='.$temporary,
        $root.'/vendor/bin/pest',
        ...array_slice($argv, 1),
        '--type-coverage',
        '--min=100',
        '--no-cache',
        '--memory-limit=512M',
        '--type-coverage-json='.$report,
    ], $root, timeout: null);

    $pest->mustRun(static function (string $stream, string $output): void {
        fwrite($stream === Process::ERR ? STDERR : STDOUT, $output);
    });

    $results = json_decode((string) file_get_contents($report), true, flags: JSON_THROW_ON_ERROR);
    $covered = array_map(static fn (string $file): string => str_replace('\\', '/', $file), array_column($results['result'], 'file'));
    $expected = [];

    $files = Finder::create()
        ->files()
        ->in($root.'/src')
        ->name('*.php')
        ->notName('*.blade.php');

    foreach ($files as $file) {
        $expected[] = 'src/'.str_replace('\\', '/', $file->getRelativePathname());
    }

    $missing = array_diff($expected, $covered);

    if ($missing !== []) {
        sort($missing);

        throw new RuntimeException('Type coverage is incomplete. Missing files: '.implode(', ', $missing));
    }

    fwrite(STDOUT, 'Type coverage analysed all '.count($expected)." eligible source files.\n");
} catch (Throwable $error) {
    fwrite(STDERR, $error->getMessage().PHP_EOL);

    $exitCode = 1;
} finally {
    $filesystem->deleteDirectory($temporary);
}

exit($exitCode);
