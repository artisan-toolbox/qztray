<?php

declare(strict_types=1);

use Illuminate\Auth\GenericUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\call;
use function Pest\Laravel\postJson;

beforeEach(function () {
    config(['app.key' => 'base64:'.base64_encode(str_repeat('a', 32))]);
    actingAs(new GenericUser(['id' => 1]));
});

it('returns a Base64 RSA SHA-512 signature as plain text without changing the payload', function (string $payload) {
    $key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
    openssl_pkey_export($key, $pem);
    config(['qztray.private_key' => $pem]);

    $response = postJson(route('qztray_connector.sign_payload'), ['payload' => $payload])
        ->assertHeader('Cache-Control', 'no-store, private')
        ->assertOk()
        ->assertHeader('Content-Type', 'text/plain; charset=UTF-8');

    $signature = base64_decode($response->getContent(), true);
    expect($signature)->not->toBeFalse()
        ->and(openssl_verify($payload, $signature, openssl_pkey_get_details($key)['key'], OPENSSL_ALGO_SHA512))->toBe(1)
        ->and(openssl_verify('different payload', $signature, openssl_pkey_get_details($key)['key'], OPENSSL_ALGO_SHA512))->toBe(0);
})->with([
    'Unicode and surrounding whitespace' => [" \n{\"message\":\"Print café + document\"}\n "],
    'only whitespace' => [" \n\t "],
    'zero string' => ['0'],
]);

it('preserves normal input normalization on other application endpoints', function () {
    Route::post('application-input', static fn (Request $request): JsonResponse => response()->json($request->all()));

    postJson('/application-input', ['payload' => ' Print ', 'empty' => ''])
        ->assertOk()
        ->assertExactJson(['payload' => 'Print', 'empty' => null]);
});

it('does not accept a query parameter instead of a JSON payload', function () {
    postJson(route('qztray_connector.sign_payload').'?payload=Print', [])
        ->assertHeader('Cache-Control', 'no-store, private')
        ->assertUnprocessable()->assertJsonPath('error.code', 'qztray.payload_invalid');
});

it('reports an invalid payload', function (mixed $payload) {
    postJson(route('qztray_connector.sign_payload'), ['payload' => $payload])
        ->assertHeader('Cache-Control', 'no-store, private')
        ->assertUnprocessable()
        ->assertJsonPath('error.code', 'qztray.payload_invalid');
})->with([null, '', 123, [[]]]);

it('reports a missing private key', function (?string $key) {
    config(['qztray.private_key' => $key]);

    postJson(route('qztray_connector.sign_payload'), ['payload' => 'Print'])
        ->assertHeader('Cache-Control', 'no-store, private')
        ->assertServiceUnavailable()
        ->assertJsonPath('error.code', 'qztray.private_key_missing');
})->with([null, '', " \n\t "]);

it('reports an invalid private key without exposing its contents', function (mixed $key) {
    config(['qztray.private_key' => $key]);

    postJson(route('qztray_connector.sign_payload'), ['payload' => 'Print'])
        ->assertHeader('Cache-Control', 'no-store, private')
        ->assertServiceUnavailable()
        ->assertExactJson(['error' => [
            'code' => 'qztray.private_key_invalid',
            'message' => 'The QZ Tray private key must be a valid unencrypted PEM-encoded RSA private key.',
        ]]);
})->with([
    'plain text' => ['not a key'],
    'malformed PEM' => ["-----BEGIN PRIVATE KEY-----\ninvalid\n-----END PRIVATE KEY-----"],
    'file reference' => ['file:///private/key.pem'],
    'array' => [[]],
    'number' => [123],
]);

it('rejects a valid non-RSA private key', function () {
    $key = openssl_pkey_new(['private_key_type' => OPENSSL_KEYTYPE_EC, 'curve_name' => 'prime256v1']);
    openssl_pkey_export($key, $pem);
    config(['qztray.private_key' => $pem]);

    postJson(route('qztray_connector.sign_payload'), ['payload' => 'Print'])
        ->assertHeader('Cache-Control', 'no-store, private')
        ->assertServiceUnavailable()->assertJsonPath('error.code', 'qztray.private_key_invalid');
});

it('rejects an encrypted private key because no passphrase is configured', function () {
    $key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
    openssl_pkey_export($key, $pem, 'Test passphrase');
    config(['qztray.private_key' => $pem]);

    postJson(route('qztray_connector.sign_payload'), ['payload' => 'Print'])
        ->assertHeader('Cache-Control', 'no-store, private')
        ->assertServiceUnavailable()->assertJsonPath('error.code', 'qztray.private_key_invalid');
});

it('requires an authenticated session for signing', function () {
    auth()->forgetGuards();

    postJson(route('qztray_connector.sign_payload'), ['payload' => 'Print'])->assertUnauthorized();
});

it('reports malformed JSON as an invalid payload', function () {
    call('POST', route('qztray_connector.sign_payload'), [], [], [], [
        'CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json',
    ], '{invalid')->assertHeader('Cache-Control', 'no-store, private')
        ->assertUnprocessable()->assertJsonPath('error.code', 'qztray.payload_invalid');
});

it('reports a real OpenSSL signing failure', function () {
    $key = openssl_pkey_new(['private_key_bits' => 512, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
    openssl_pkey_export($key, $pem);
    config(['qztray.private_key' => $pem]);

    postJson(route('qztray_connector.sign_payload'), ['payload' => 'Print'])
        ->assertHeader('Cache-Control', 'no-store, private')
        ->assertServiceUnavailable()->assertJsonPath('error.code', 'qztray.signing_failed');
});

it('enforces CSRF protection outside the testing environment', function () {
    app()->instance('env', 'production');

    postJson(route('qztray_connector.sign_payload'), ['payload' => 'Print'])->assertStatus(419);
});
