<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Date;

use function Pest\Laravel\get;

beforeEach(function () {
    Date::setTestNow('2030-01-01 00:00:00 UTC');
});

afterEach(function () {
    Date::setTestNow();
});

it('returns the configured certificate unchanged as UTF-8 plain text', function () {
    $certificate = file_get_contents(__DIR__.'/../Fixtures/certificate.pem');
    config(['qztray.public_key' => $certificate, 'qztray.private_key' => 'Private key must stay on the server']);

    get(route('qztray_connector.get_public_key'))
        ->assertHeader('Cache-Control', 'no-store, private')
        ->assertOk()
        ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
        ->assertContent($certificate);
});

it('reports a missing certificate', function (?string $certificate) {
    config(['qztray.public_key' => $certificate]);

    get(route('qztray_connector.get_public_key'))->assertHeader('Cache-Control', 'no-store, private')
        ->assertServiceUnavailable()
        ->assertJsonPath('error.code', 'qztray.certificate_missing')
        ->assertJsonPath('error.message', 'The QZ Tray public certificate is not configured. Set qztray.public_key in config/qztray.php.');
})->with([null, '', " \n\t "]);

it('reports an invalid certificate without exposing its contents', function (mixed $certificate) {
    config(['qztray.public_key' => $certificate]);

    get(route('qztray_connector.get_public_key'))->assertHeader('Cache-Control', 'no-store, private')
        ->assertServiceUnavailable()
        ->assertExactJson(['error' => [
            'code' => 'qztray.certificate_invalid',
            'message' => 'The QZ Tray public certificate must be a valid PEM-encoded X.509 certificate.',
        ]]);
})->with([
    'plain text' => ['invalid certificate'],
    'malformed PEM' => ["-----BEGIN CERTIFICATE-----\ninvalid\n-----END CERTIFICATE-----"],
    'file reference' => ['file://'.__DIR__.'/../Fixtures/certificate.pem'],
    'non-string value' => [123],
    'array value' => [[]],
]);

it('rejects a certificate before its validity period', function () {
    $certificate = file_get_contents(__DIR__.'/../Fixtures/certificate.pem');
    $details = openssl_x509_parse($certificate);
    Date::setTestNow(Date::createFromTimestamp($details['validFrom_time_t'] - 1));
    config(['qztray.public_key' => $certificate]);

    get(route('qztray_connector.get_public_key'))->assertHeader('Cache-Control', 'no-store, private')
        ->assertServiceUnavailable()
        ->assertJsonPath('error.code', 'qztray.certificate_not_yet_valid');
});

it('accepts a certificate at the start of its validity period', function () {
    $certificate = file_get_contents(__DIR__.'/../Fixtures/certificate.pem');
    $details = openssl_x509_parse($certificate);
    Date::setTestNow(Date::createFromTimestamp($details['validFrom_time_t']));
    config(['qztray.public_key' => $certificate]);

    get(route('qztray_connector.get_public_key'))->assertHeader('Cache-Control', 'no-store, private')
        ->assertOk()->assertContent($certificate);
});

it('rejects a certificate at or after its expiry time', function (int $offset) {
    $certificate = file_get_contents(__DIR__.'/../Fixtures/certificate.pem');
    $details = openssl_x509_parse($certificate);
    Date::setTestNow(Date::createFromTimestamp($details['validTo_time_t'] + $offset));
    config(['qztray.public_key' => $certificate]);

    get(route('qztray_connector.get_public_key'))->assertHeader('Cache-Control', 'no-store, private')
        ->assertServiceUnavailable()
        ->assertJsonPath('error.code', 'qztray.certificate_expired');
})->with([0, 1]);
