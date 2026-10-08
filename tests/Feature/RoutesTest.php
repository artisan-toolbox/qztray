<?php

declare(strict_types=1);

use ArtisanToolbox\QzTrayConnector\Http\Controllers\GetPublicKey;
use ArtisanToolbox\QzTrayConnector\Http\Controllers\SignPayload;
use Illuminate\Support\Facades\Route;

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
