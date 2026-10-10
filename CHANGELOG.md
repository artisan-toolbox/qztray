# Release Notes

## [Unreleased](https://github.com/artisan-toolbox/qztray/compare/v0.1.0...1.x)

### Added

- Add `renderAll` to `renderZpl()`, defaulting to `false` for a single PNG data URL and returning an ordered array of PNG data URLs with inferred TypeScript types when enabled.

- Add standalone `renderZpl()` PNG previews using the local `zpl-renderer-js` WebAssembly engine, internal asset resolution, shared lazy initialization, and typed dimensions and rendering options.
- Ship the renderer WASM as a separate asset that Vite applications discover automatically, keeping it out of JavaScript bundles.

- Add `QzTray` as the public singleton class and compose internal connection, security, and printer managers while preserving existing printing and lifecycle behavior.

- Add `printEscpos()`, `printZpl()`, `printRaw()`, and `printPdf()` shortcuts accepting a printer, payload, and optional configuration while delegating to the main `print()` method.

- Add public `print()` with typed ESC/POS, ZPL, generic raw, and PDF presets, string or array payloads, per-job QZ configuration overrides, and PDF document options.
- Default raw driver bypass to enabled on macOS, keep it configurable per job, and support explicit raw flavors and PDF URL or Base64 sources.

- Add public `getPrinters()` to establish or reuse a secure QZ Tray connection and retrieve a fresh array of local printer names, propagating lookup failures.

- Add public `disconnect()` with live socket checks, shared concurrent attempts, coordination with pending connections, and retry support after failure.

- Add public `connect()` with SHA-512 certificate and signature callbacks, concurrent connection sharing, retry support, and certificate failure rejection.
- Add public `isConnected()` backed by QZ Tray's live WebSocket status instead of a cached connection flag.

- Add private frontend `signPayload(payload)` requests and a session-authenticated, CSRF-protected signing endpoint using the configured RSA private key and SHA-512, returning Base64 signatures as plain text while preserving the exact payload.
- Export `QzTraySigningError` with structured feedback for invalid payloads, private key configuration, signing failures, authentication, and CSRF errors.
- Cache the public certificate in the shared frontend connector after a successful retrieval, share in-flight requests between concurrent callers, and allow retries after failures.
- Require the PHP OpenSSL extension and validate the configured public certificate's X.509 format and validity dates on retrieval, returning the PEM content on success and specific JSON errors for missing, malformed, not-yet-valid, or expired certificates.
- Export `QzTrayCertificateError` with `code` and `status` so applications can distinguish backend certificate configuration errors from unexpected HTTP responses.
- Add a private frontend certificate retrieval method using native Fetch and the Ziggy route `qztray_connector.get_public_key`, with same-origin session credentials and HTTP error handling.
- Add the frontend `QzTrayConnector` base class with a private constructor and `getInstance()`, and export its shared instance as both `qztray` and the default export.
- Add the frontend library scaffold with Vite Plus, strict TypeScript, an empty entry point, and ESM, CommonJS, and IIFE build outputs.
- Add an initial frontend smoke test to verify that the empty entry point loads successfully.

### Deprecated

- Deprecate the `QzTrayConnector` class name in favor of `QzTray`, retaining it as an alias of the same class and instance.

### Documentation

- Organize frontend tests under `tests/Frontend` alongside the PHP suites, retaining discovery, formatting, linting, and TypeScript checks.

- Document the application's Ziggy installation, global route configuration, and required connector route names.
- Document publishing `config/qztray.php`, setting the matching PEM certificate and private key for future QZ Tray print request authentication, and refreshing Laravel's configuration cache.
- Replace the skeleton README with the package overview, requirements, development status, and links to the canonical documentation.

### Fixed

- Document and verify Vite development-server permissions for WASM assets in locally linked packages outside the application workspace.

- Disable HTTP caching for certificate and signing requests and controller responses, including errors, while preserving the certificate cache within the frontend connector.

- Default the ESC/POS print preset to CP850 for receipt text, while preserving per-job encoding overrides and the existing ZPL and generic raw defaults.

- Isolate configuration publishing tests in unique temporary directories to prevent races during parallel test execution.

- Verify credential configuration publishing using resolved source paths and published contents, avoiding false failures caused by Windows path separators.

- Use Laravel's native JSON parsing and string accessor for signing payloads, with a signing-endpoint-only trimming exception to preserve exact bytes without changing other application inputs.

- Replace obsolete scaffold expectations with credential configuration merge, application override, and publish-tag coverage; remove the deleted scaffold database directory from PHPStan's analysis paths.
- Return the public certificate endpoint with `Content-Type: text/plain; charset=UTF-8` instead of Laravel's default HTML content type.
- Apply the connector route name prefix before registering its routes so Ziggy receives `qztray_connector.get_public_key` and `qztray_connector.sign_payload` instead of names starting with a dot.
- Align and pin Vite Plus and its Vite core alias to version 0.3.3 so frontend builds, including watch mode, can start successfully.
- Remove duplicate PHPStan extension includes; Larastan and Carbon are registered automatically by the Composer extension installer.

## [v0.1.0](https://github.com/artisan-toolbox/qztray/compare/...v0.1.0) - 202x-xx-xx

Initial pre-release.
