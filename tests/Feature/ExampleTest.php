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
    expect(ServiceProvider::pathsToPublish(QzTrayConnectorServiceProvider::class, $tag))
        ->toBe([
            dirname(__DIR__, 2).'/src/../config/qztray.php' => config_path('qztray.php'),
        ]);
})->with(['qztray-config', 'qztray']);

it('registers the artisan command', function () {
    artisan('qztray:placeholder')
        ->expectsOutputToContain('QzTrayConnector placeholder command executed.')
        ->assertSuccessful();
});
