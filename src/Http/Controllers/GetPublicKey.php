<?php

declare(strict_types=1);

namespace ArtisanToolbox\QzTrayConnector\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class GetPublicKey extends Controller
{
    public function __invoke(): Response|JsonResponse
    {
        $certificate = config('qztray.public_key');

        if ($certificate === null || (is_string($certificate) && trim($certificate) === '')) {
            return $this->error('qztray.certificate_missing', 'The QZ Tray public certificate is not configured. Set qztray.public_key in config/qztray.php.');
        }

        if (! is_string($certificate) || ! str_starts_with(trim($certificate), '-----BEGIN CERTIFICATE-----')) {
            return $this->invalidCertificate();
        }

        // Malformed PEM is a configuration error, not an unhandled OpenSSL warning.
        $details = @openssl_x509_parse($certificate);

        if ($details === false || ! is_int($details['validFrom_time_t'] ?? null) || ! is_int($details['validTo_time_t'] ?? null)) {
            return $this->invalidCertificate();
        }

        $timestamp = now()->getTimestamp();

        if ($timestamp < $details['validFrom_time_t']) {
            return $this->error('qztray.certificate_not_yet_valid', 'The QZ Tray public certificate is not yet valid. Check the certificate and the server clock.');
        }

        if ($timestamp >= $details['validTo_time_t']) {
            return $this->error('qztray.certificate_expired', 'The QZ Tray public certificate has expired. Replace qztray.public_key with a current certificate.');
        }

        return response($certificate, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }

    private function invalidCertificate(): JsonResponse
    {
        return $this->error('qztray.certificate_invalid', 'The QZ Tray public certificate must be a valid PEM-encoded X.509 certificate.');
    }

    private function error(string $code, string $message): JsonResponse
    {
        return response()->json(['error' => ['code' => $code, 'message' => $message]], 503);
    }
}
