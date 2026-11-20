<?php

declare(strict_types=1);

use Illuminate\Filesystem\Filesystem;
use Symfony\Component\Process\Process;

it('rejects a successful Pest run that leaves a partial type coverage report', function (): void {
    $root = dirname(__DIR__, 2);
    $workspace = sys_get_temp_dir().'/qztray-type-check-'.bin2hex(random_bytes(8));
    $files = new Filesystem;

    try {
        $files->ensureDirectoryExists($workspace.'/tests/Support');
        $files->ensureDirectoryExists($workspace.'/vendor/bin');
        $files->ensureDirectoryExists($workspace.'/src');
        $files->copy($root.'/tests/Support/check-type-coverage.php', $workspace.'/tests/Support/check-type-coverage.php');
        $files->put($workspace.'/vendor/autoload.php', '<?php require '.var_export($root.'/vendor/autoload.php', true).';');
        $files->put($workspace.'/src/Reported.php', '<?php final class Reported {}');
        $files->put($workspace.'/src/Missing.php', '<?php /** Use a trait here. */ final class Missing {}');
        $files->put($workspace.'/vendor/bin/pest', <<<'PHP'
            <?php
            foreach ($argv as $argument) {
                if (str_starts_with($argument, '--type-coverage-json=')) {
                    $report = substr($argument, strlen('--type-coverage-json='));
                    file_put_contents($report, '{"result":[{"file":"src/Reported.php","percentage":100}]}');
                    exit(0);
                }
            }
            exit(1);
            PHP);

        $check = new Process([PHP_BINARY, $workspace.'/tests/Support/check-type-coverage.php']);

        expect($check->run())->toBe(1)
            ->and($check->getErrorOutput())->toContain('Type coverage is incomplete. Missing files: src/Missing.php');
    } finally {
        $files->deleteDirectory($workspace);
    }
});
