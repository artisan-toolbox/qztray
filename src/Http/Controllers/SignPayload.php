<?php

declare(strict_types=1);

namespace ArtisanToolbox\QzTrayConnector\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class SignPayload extends Controller
{
    public function __invoke(Request $request): Response|JsonResponse
    {
        if (! $request->isJson()) {
            return $this->invalidPayload();
        }

        $payload = $request->json('payload');

        if (! is_string($payload) || $payload === '') {
            return $this->invalidPayload();
        }

        $payload = $request->string('payload')->toString();

        $pem = config('qztray.private_key');

        if ($pem === null || (is_string($pem) && trim($pem) === '')) {
            return $this->error('qztray.private_key_missing', 'The QZ Tray private key is not configured. Set qztray.private_key in config/qztray.php.', 503);
        }

        if (! is_string($pem) || (! str_starts_with(trim($pem), '-----BEGIN PRIVATE KEY-----') && ! str_starts_with(trim($pem), '-----BEGIN RSA PRIVATE KEY-----'))) {
            return $this->invalidPrivateKey();
        }

        // Invalid configured keys must produce structured errors without OpenSSL diagnostics.
        $privateKey = @openssl_pkey_get_private($pem, '');
        $details = $privateKey === false ? false : openssl_pkey_get_details($privateKey);

        if ($privateKey === false || $details === false || $details['type'] !== OPENSSL_KEYTYPE_RSA) {
            return $this->invalidPrivateKey();
        }

        $signature = '';
        $signed = @openssl_sign($payload, $signature, $privateKey, OPENSSL_ALGO_SHA512);

        if (! $signed || $signature === '') {
            return $this->error('qztray.signing_failed', 'The QZ Tray payload could not be signed with the configured private key using SHA-512.', 503);
        }

        return response(base64_encode($signature), 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }

    private function invalidPayload(): JsonResponse
    {
        return $this->error('qztray.payload_invalid', 'Send a JSON object with a nonempty string payload to sign.', 422);
    }

    private function invalidPrivateKey(): JsonResponse
    {
        return $this->error('qztray.private_key_invalid', 'The QZ Tray private key must be a valid unencrypted PEM-encoded RSA private key.', 503);
    }

    private function error(string $code, string $message, int $status): JsonResponse
    {
        return response()->json(['error' => ['code' => $code, 'message' => $message]], $status);
    }
}
