# Release Notes

## [Unreleased](https://github.com/artisan-toolbox/qztray/compare/v0.1.0...1.x)

### Added

- Present the public documentation and README as the 1.x series, with sidebar navigation and a compatibility reference replacing prerelease status notes.

- Accept ordered ESC/POS print arrays containing text commands and QZ raw images with Base64 or file sources, preserve image options, and default omitted image languages to `ESCPOS` in both `print()` and `printEscpos()`.

- Bundle the official `qz-lna` browser helper and register it before connecting, preserving an existing application helper, avoiding the SDK's optional `require('lna')` warning, and retaining local-network permission diagnostics.

- Expand the canonical documentation with an installation quickstart, component and API responsibilities, actual SDK error boundaries, and v1 release readiness notes; replace the bundled Laravel Boost integration skill's placeholders with verified adoption instructions.
- Run the frontend test suite in `prepublishOnly` before building npm releases.
- Add frontend CI coverage for the declared Node 20.19 and 22.18 minimum versions on Ubuntu and Windows, and exercise actual QZ SDK signing error wrapping through an emulated transport.

- Add standalone `renderPdf()` PNG previews for URLs, Base64, binary strings, byte buffers, ArrayBuffers, and Blobs, with typed single/all-page results, page selection, scale, rotation, passwords, and configurable downloads. Ship the PDF.js worker and auxiliary font, CMap, WASM, and license assets with lazy rendering and per-document cleanup.

- Infer the encoding of plain ZPL print jobs from supported `^CI` commands when `options.encoding` is omitted, retaining UTF-8 for missing, unsupported, or conflicting declarations and preserving explicit overrides.

- Accept mixed text, byte buffers, and QZ-style Base64 raw images in ESC/POS previews, preserving order and printer state with typed image options, browser decoding, monochrome conversion, and legacy cut support.

- Add standalone `renderEscpos()` PNG previews with lazy loading, CP850 text conversion, preserved control bytes and binary payloads, printable width and character-table mapping options, and typed `renderAll` results separated by receipt cuts.

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

- Declare Maintainer as a production dependency because the PHP service implements its `Versionable` interface, preserving the existing public contract during installations without development dependencies.
- Reject malformed successful certificate and signature responses before caching or forwarding them to QZ, and request structured certificate errors with `Accept: application/json` while preserving plain-text successes.
- Snapshot typed-array subclasses such as Buffer into owned plain bytes for ESC/POS and PDF previews, preventing shared-memory mutation and PDF.js Buffer rejection.
- Use PDF.js's real legacy distribution in the headless integration test to support Node 20 without changing the browser renderer.

- Resolve the ZPL packaging test's temporary directory to its native canonical path so Vite's filesystem security checks do not reject Windows 8.3 aliases from CI runners.

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
