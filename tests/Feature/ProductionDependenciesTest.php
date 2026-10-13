<?php

declare(strict_types=1);

use ArtisanToolbox\QzTrayConnector\QzTrayConnector;
use Symfony\Component\Process\Process;

it('loads its PHP service with only declared production dependency autoloaders', function () {
    $process = new Process([PHP_BINARY, dirname(__DIR__).'/Fixtures/production-autoload.php']);
    $process->run();

    expect($process->isSuccessful())->toBeTrue($process->getErrorOutput())
        ->and($process->getOutput())->toBe(QzTrayConnector::class);
});
