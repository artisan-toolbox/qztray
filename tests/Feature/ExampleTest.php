<?php

declare(strict_types=1);

use ArtisanToolbox\QzTrayConnector\QzTrayConnector;
use ArtisanToolbox\QzTrayConnector\QzTrayConnectorServiceProvider;
use Illuminate\Support\ServiceProvider;

use function Pest\Laravel\artisan;

it('resolves the singleton', function () {
    expect(resolve(QzTrayConnector::class))->toBeInstanceOf(QzTrayConnector::class);
});

it('returns the same instance from the container', function () {
    expect(resolve(QzTrayConnector::class))->toBe(resolve(QzTrayConnector::class));
});

it('merges the package config', function () {
    expect(config('qztray'))->toBe([
        'public_key' => '',
        'private_key' => '',
    ]);
});

it('preserves application credentials when merging package defaults', function () {
    config(['qztray' => ['public_key' => 'Application certificate']]);

    (new QzTrayConnectorServiceProvider(app()))->register();

    expect(config('qztray'))->toBe([
        'public_key' => 'Application certificate',
        'private_key' => '',
    ]);
});

it('publishes the credential configuration with the supported tag', function (string $tag) {
    $paths = ServiceProvider::pathsToPublish(QzTrayConnectorServiceProvider::class, $tag);
    $source = dirname(__DIR__, 2).'/config/qztray.php';
    $destination = config_path('qztray.php');

    expect($paths)->toHaveCount(1)
        ->and(realpath(array_key_first($paths)))->toBe(realpath($source))
        ->and(array_values($paths))->toBe([$destination]);

    $original = is_file($destination) ? file_get_contents($destination) : null;

    try {
        artisan('vendor:publish', [
            '--provider' => QzTrayConnectorServiceProvider::class,
            '--tag' => $tag,
            '--force' => true,
        ])->assertSuccessful();

        expect(is_file($destination))->toBeTrue()
            ->and(file_get_contents($destination))->toBe(file_get_contents($source));
    } finally {
        if ($original === null) {
            if (is_file($destination)) {
                unlink($destination);
            }
        } else {
            file_put_contents($destination, $original);
        }
    }
})->with(['qztray-config', 'qztray']);

it('registers the artisan command', function () {
    artisan('qztray:placeholder')
        ->expectsOutputToContain('QzTrayConnector placeholder command executed.')
        ->assertSuccessful();
});
