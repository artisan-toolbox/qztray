<?php

declare(strict_types=1);

use ArtisanToolbox\QzTrayConnector\QzTrayConnector;
use Symfony\Component\Process\Process;

const PRODUCTION_AUTOLOAD_COMMAND = [
    PHP_BINARY,
    '-d',
    'auto_prepend_file=none',
    __DIR__.'/../Fixtures/production-autoload.php',
];

it('loads its PHP service with only declared production dependency autoloaders', function () {
    $process = new Process(PRODUCTION_AUTOLOAD_COMMAND);
    $process->run();

    expect($process->isSuccessful())->toBeTrue($process->getOutput().$process->getErrorOutput())
        ->and($process->getOutput())->toBe(QzTrayConnector::class);
});

it('loads declared support helpers without framework helpers or optional dependencies', function () {
    $process = new Process([...PRODUCTION_AUTOLOAD_COMMAND, 'helpers']);
    $process->run();

    expect($process->isSuccessful())->toBeTrue($process->getOutput().$process->getErrorOutput())
        ->and($process->getOutput())->toBe(json_encode([
            'throw_if' => true,
            'throw_unless' => true,
            'app' => false,
            'escpos' => false,
        ], JSON_THROW_ON_ERROR));
});

it('explains the optional dependency when generating ESC/POS without it', function () {
    $process = new Process([...PRODUCTION_AUTOLOAD_COMMAND, 'escpos']);
    $process->run();

    expect($process->isSuccessful())->toBeTrue($process->getOutput().$process->getErrorOutput())
        ->and($process->getOutput())->toContain('composer require mike42/escpos-php:^5.0');
});
