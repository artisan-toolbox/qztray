<?php

declare(strict_types=1);

use ArtisanToolbox\QzTrayConnector\Http\Controllers\GetPublicKey;
use ArtisanToolbox\QzTrayConnector\Http\Controllers\SignPayload;
use Illuminate\Support\Facades\Route;

use function Pest\Laravel\get;

it('returns the public certificate response as UTF-8 plain text', function () {
    get(route('qztray_connector.get_public_key'))
        ->assertOk()
        ->assertHeader('Content-Type', 'text/plain; charset=UTF-8');
});

it('registers named connector routes for Ziggy', function () {
    $publicKeyRoute = Route::getRoutes()->getByName('qztray_connector.get_public_key');
    $signPayloadRoute = Route::getRoutes()->getByName('qztray_connector.sign_payload');

    expect($publicKeyRoute)->not->toBeNull()
        ->and($publicKeyRoute?->uri())->toBe('qztray-connector/get-public-key')
        ->and($publicKeyRoute?->methods())->toBe(['GET', 'HEAD'])
        ->and($publicKeyRoute?->getActionName())->toBe(GetPublicKey::class)
        ->and($signPayloadRoute)->not->toBeNull()
        ->and($signPayloadRoute?->uri())->toBe('qztray-connector/sign-payload')
        ->and($signPayloadRoute?->methods())->toBe(['POST'])
        ->and($signPayloadRoute?->getActionName())->toBe(SignPayload::class);
});
