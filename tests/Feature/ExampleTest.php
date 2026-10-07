<?php

declare(strict_types=1);

use ArtisanToolbox\QzTrayConnector\QzTrayConnector;

it('resolves the singleton', function () {
    expect(app(QzTrayConnector::class))->toBeInstanceOf(QzTrayConnector::class);
});

it('returns the same instance from the container', function () {
    expect(app(QzTrayConnector::class))->toBe(app(QzTrayConnector::class));
});

it('merges the package config', function () {
    expect(config('qztray.placeholder'))->toBe('default');
});

it('loads the package translations', function () {
    expect(trans('qztray::messages.placeholder'))->toBe('QzTrayConnector placeholder translation.');
});

it('loads the package views', function () {
    expect(view()->exists('qztray::placeholder'))->toBeTrue();
});

it('registers the artisan command', function () {
    $this->artisan('qztray:placeholder')
        ->expectsOutputToContain('QzTrayConnector placeholder command executed.')
        ->assertSuccessful();
});
