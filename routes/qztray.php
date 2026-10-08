<?php

declare(strict_types=1);

use ArtisanToolbox\QzTrayConnector\Http\Controllers\GetPublicKey;
use ArtisanToolbox\QzTrayConnector\Http\Controllers\SignPayload;
use Illuminate\Support\Facades\Route;

Route::prefix('qztray-connector')->name('qztray_connector')->group(function () {
    Route::get('get-public-key', GetPublicKey::class)
        ->name('.get_public_key');
    Route::post('sign-payload', SignPayload::class)
        ->middleware(['web', 'auth'])
        ->name('.sign_payload');
});
