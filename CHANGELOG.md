# Changelog

## [1.1.0] - 2026-10-13

### Fixes

- **Run before-versioning npm build reliably** (`8c82e8b`)
  Updates the before-versioning frontend build process (used during the versioning lifecycle) to run more reliably by adjusting how the npm build command is invoked. This matters because the build must succeed before the project proceeds with versioning; improving reliability reduces CI/developer failures when the maintainer runs versioning from a different directory or with differing process context. User impact: versioning should be less flaky; however, the change still means versioning can fail if required node/npm dependencies or the build environment are not available at version time. Compatibility/migration: no API changes are indicated, but ensure the runtime environment executing versioning has access to frontend build prerequisites.

### Refactoring

- **Update versioning/CI/documentation for bundled frontend distribution** (`63704d5`)
  Applies the broader 1.1.0 distribution and validation changes: adds a GitHub Actions job to build the frontend and verify tracked dist assets, removes `/dist` from `.gitignore` (so dist artifacts are no longer globally ignored), adds/updates release notes and README/SKILL installation instructions to install a private local vendor frontend package (via composer distribution into `vendor/...`) and then run `npm install ./vendor/artisan-toolbox/qztray` from the Laravel app root instead of using an npm-published package, bumps package/versioning-related metadata, introduces a `scripts/check-distribution.mjs` validator that enforces the tracked `dist/` content matches the Git state (failing CI/release if dist is missing/dirty/untracked), updates `QzTrayConnector` to bump version to 1.1.0 and to implement `BeforeVersioning` that runs `npm run build` from the project root during versioning, adds feature tests for successful/failed before-versioning build behavior, and expands frontend render build tests to validate composer-packaged/tarball distribution includes `dist/*` (including wasm) and sets `package.json` to `{ private: true }`. User impact: frontend assets are now validated in CI and packaged via composer-distributed vendor artifacts rather than an npm registry publish flow; builds execute automatically during before-versioning, so versioning requires a working Node/npm environment. Compatibility/migration: installations/workflows that previously depended on installing `@artisan-toolbox/qztray` from npm-published artifacts must switch to installing from the composer-provided `vendor/artisan-toolbox/qztray` using the documented local-path `npm install ./vendor/artisan-toolbox/qztray`, and deployments must run Composer before npm.

### Maintenance

- **Run npm build via single command string** (`a7033e6`)
  Refactors the npm build invocation to run via a single command string rather than composing multiple arguments. This matters because it improves the execution semantics of the build process when called from within the backend versioning hook (BeforeVersioning), particularly in environments where argument handling can differ. User impact: more consistent build execution during versioning; it doesn’t change intended functionality besides how the command is dispatched. Compatibility/migration: no migration required, but continue to ensure build prerequisites exist wherever versioning is triggered.

## [1.0.0] - 2026-10-13

### Features

- **Add renderPdf and PDF assets with node/browser compatibility** (`6d8240e`)
  Added a `renderPdf` capability along with required PDF assets, with explicit compatibility for both Node.js and browser environments. This enables PDF rendering workflows consistently across supported runtimes, improving developer flexibility for generating/previewing PDF output. No breaking changes are implied, but consumers may take advantage of the new renderer and assets where previously only other formats were supported.

- **Infer encoding from CI for plain ZPL prints** (`889ab22`)
  Enhanced the ZPL printing path for “plain ZPL” to infer character encoding from `^CI`, improving output correctness in continuous integration environments where encoding assumptions may differ. This reduces mis-rendered ZPL text and unexpected character substitutions. Existing consumers should see more consistent ZPL output; no configuration/migration changes are required unless they relied on the previous (incorrect/inconsistent) encoding behavior.

- **Add renderEscpos PNG previews with typed options** (`737c435`)
  Introduced `renderEscpos` PNG previews and added typed options to define preview behavior more safely. This helps developers generate visual previews of ESC/POS output without printing to hardware, and the typed options improve correctness and IDE/type-checker assistance. User impact is positive (new preview capability); compatibility impact is expected to be additive, with no required migration unless developers want to adopt the new typed options.

- **Add local ZPL rendering with shipped WASM asset support** (`d988edd`)
  Implemented local ZPL rendering using a shipped WebAssembly (WASM) asset bundle, enabling ZPL to be rendered without relying solely on external services. This improves reliability and potentially performance for rendering workflows and enables offline/controlled-environment rendering. Consumers can now render ZPL locally; compatibility should be additive, but environments must support WASM loading as implemented.

- **Introduce public QzTray singleton with typed printing API** (`1e1c368`)
  Added a new public `QzTray` singleton with a typed printing API (breaking change, indicated by `feat!`). This centralizes QZ Tray access and provides stronger typing for printing operations, making integration more consistent and reducing runtime errors from malformed payloads. Breaking impact: existing integrations may need to migrate from older construction/patterns to the new singleton-based approach and adapt to updated typed method signatures. Migration likely includes updating how QZ Tray is initialized/accessed and aligning print calls with the typed API.

- **Add private signPayload endpoint with CSRF auth** (`4bbbaf3`)
  Added a private `signPayload` endpoint secured with CSRF authentication. This allows payload signing via a dedicated endpoint while ensuring requests are protected against CSRF attacks. Security impact is positive by reducing the risk of unauthorized signing. Compatibility impact should be additive; however, consumers/clients must send requests in a way that satisfies CSRF requirements.

- **Cache QZ Tray public certificate and validate config** (`583c71f`)
  Implemented caching for the QZ Tray public certificate and added configuration validation. This improves performance by reusing certificate material and increases correctness by failing fast when configuration is invalid. User impact is faster and more stable initialization/operation; no explicit migration is required unless users previously had misconfigurations that will now be detected/validated.

- **Add Ziggy connector routes and certificate retrieval** (`2e6db88`)
  Added Ziggy connector routes and implemented certificate retrieval functionality. This supports route-based integration patterns (via Ziggy) and provides a way to retrieve the needed certificate for connector operations. User impact is improved connectivity/integration ergonomics. Compatibility should be additive, but consumers may need to use the new routes for certificate retrieval if they previously implemented custom retrieval logic.

- **Add Vite-based frontend scaffold and update CI matrix** (`8e7fabe`)
  Added a Vite-based frontend scaffold and updated the CI matrix to cover the new frontend tooling/runtimes. This enables more modern frontend development workflow (build/preview tooling) and ensures CI validates the frontend checks across intended environments. User impact is primarily for contributors/developers; library runtime behavior is not directly changed, but build/test pipelines are improved. No migration for consumers is expected.

### Fixes

- **Extend CI timeout for real package build test** (`8f08f37`)
  Increased the CI timeout used for the real package build test to prevent intermittent failures during slower build environments. This improves CI reliability without changing runtime/library behavior. User impact is limited to fewer CI flake-related failures; no compatibility or migration steps are required.

- **Verify credential publish paths and contents on Windows** (`48d2576`)
  Fixed credential publishing behavior by verifying the publish paths and contents specifically on Windows. This addresses issues where path handling or file contents differed across OSes, leading to failures in credential availability for QZ Tray operations. User impact is improved cross-platform reliability for Windows users; no migration is expected for most users beyond benefiting from the fix.

### Maintenance

- **Bump artisan-toolbox/maintainer to ^1.5** (`845f829`)
  Upgraded the `artisan-toolbox/maintainer` dependency to `^1.5`. This is a maintenance change that may update linting/quality-check behavior used in CI and developer workflows. User impact is indirect (tooling/CI behavior may change). No code migration is typically required for library consumers.

- **Add package-lock.json and update .gitignore** (`9c8d0ea`)
  Added `package-lock.json` to the repository and updated `.gitignore` entries accordingly. This improves deterministic Node dependency installs and reduces friction for contributors/CI by keeping lockfile state aligned. User impact is limited to development/build consistency; no runtime API or compatibility changes.

- **Initial commit** (`5792737`)
  Includes the changes introduced by commit 5792737: Initial commit.

# Release Notes

## [Unreleased](https://github.com/artisan-toolbox/qztray/compare/v0.1.0...1.x)

### Added

- Distribute the compiled frontend and renderer assets through Composer, install the private local frontend package from `vendor/artisan-toolbox/qztray`, and verify Git archive contents and tracked-build freshness in CI without npm registry publication.

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

- Run the before-versioning frontend build from the package root with separate npm arguments, preserving build-failure rejection when Maintainer runs from another application directory.

- Allow the real library-and-consumer packaging test two minutes on shared CI runners, avoiding a premature 30-second timeout while retaining asset and SDK integration assertions.

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
