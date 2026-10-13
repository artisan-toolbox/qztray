<?php

declare(strict_types=1);

use ArtisanToolbox\QzTrayConnector\QzTrayConnector;
use Illuminate\Process\Exceptions\ProcessFailedException;
use Illuminate\Process\PendingProcess;
use Illuminate\Support\Facades\Process;

it('builds the frontend from the package root when the host application has another base path', function () {
    Process::preventStrayProcesses();
    Process::fake();

    QzTrayConnector::beforeVersioning('1.0.0', '1.0.1');

    Process::assertRan(fn (PendingProcess $process): bool => $process->command === ['npm', 'run', 'build']
        && $process->path === dirname(__DIR__, 2)
        && $process->timeout === null,
    );
    Process::assertRanTimes(fn (PendingProcess $process): bool => $process->command === ['npm', 'run', 'build'], 1);
});

it('aborts versioning when the frontend build fails', function () {
    Process::preventStrayProcesses();
    Process::fake([
        '*' => Process::result(errorOutput: 'Frontend compilation failed.', exitCode: 1),
    ]);

    expect(fn () => QzTrayConnector::beforeVersioning('1.0.0', '1.0.1'))
        ->toThrow(ProcessFailedException::class, 'Frontend compilation failed.');
});
