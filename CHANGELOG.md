# Release Notes

## [Unreleased](https://github.com/artisan-toolbox/qztray/compare/v0.1.0...1.x)

### Added

- Add private frontend `signPayload(payload)` requests and a session-authenticated, CSRF-protected signing endpoint using the configured RSA private key and SHA-512, returning Base64 signatures as plain text while preserving the exact payload.
- Export `QzTraySigningError` with structured feedback for invalid payloads, private key configuration, signing failures, authentication, and CSRF errors.
- Cache the public certificate in the shared frontend connector after a successful retrieval, share in-flight requests between concurrent callers, and allow retries after failures.
- Require the PHP OpenSSL extension and validate the configured public certificate's X.509 format and validity dates on retrieval, returning the PEM content on success and specific JSON errors for missing, malformed, not-yet-valid, or expired certificates.
- Export `QzTrayCertificateError` with `code` and `status` so applications can distinguish backend certificate configuration errors from unexpected HTTP responses.
- Add a private frontend certificate retrieval method using native Fetch and the Ziggy route `qztray_connector.get_public_key`, with same-origin session credentials and HTTP error handling.
- Add the frontend `QzTrayConnector` base class with a private constructor and `getInstance()`, and export its shared instance as both `qztray` and the default export.
- Add the frontend library scaffold with Vite Plus, strict TypeScript, an empty entry point, and ESM, CommonJS, and IIFE build outputs.
- Add an initial frontend smoke test to verify that the empty entry point loads successfully.

### Documentation

- Document the application's Ziggy installation, global route configuration, and required connector route names.
- Document publishing `config/qztray.php`, setting the matching PEM certificate and private key for future QZ Tray print request authentication, and refreshing Laravel's configuration cache.
- Replace the skeleton README with the package overview, requirements, development status, and links to the canonical documentation.

### Fixed

- Verify credential configuration publishing using resolved source paths and published contents, avoiding false failures caused by Windows path separators.

- Use Laravel's native JSON parsing and string accessor for signing payloads, with a signing-endpoint-only trimming exception to preserve exact bytes without changing other application inputs.

- Replace obsolete scaffold expectations with credential configuration merge, application override, and publish-tag coverage; remove the deleted scaffold database directory from PHPStan's analysis paths.
- Return the public certificate endpoint with `Content-Type: text/plain; charset=UTF-8` instead of Laravel's default HTML content type.
- Apply the connector route name prefix before registering its routes so Ziggy receives `qztray_connector.get_public_key` and `qztray_connector.sign_payload` instead of names starting with a dot.
- Align and pin Vite Plus and its Vite core alias to version 0.3.3 so frontend builds, including watch mode, can start successfully.
- Remove duplicate PHPStan extension includes; Larastan and Carbon are registered automatically by the Composer extension installer.

## [v0.1.0](https://github.com/artisan-toolbox/qztray/compare/...v0.1.0) - 202x-xx-xx

Initial pre-release.
