---
name: qztray-development
description: >
  Configure and apply the Qz Tray Connector package in Laravel applications.
license: MIT
metadata:
  author: Allan Mariucci Carvalho
---

# Qz Tray Connector

Use this skill when a Laravel application needs to integrate the Qz Tray Connector package.

## Primary Goal

- apply the `artisan-toolbox/qztray` package's public API in the smallest correct way

## Workflow

### 1. Inspect the Laravel app context

- confirm the app is a Laravel project
- inspect the target code paths where the package should be applied

### 2. Apply the package's public API

- Install `artisan-toolbox/qztray` and `tightenco/ziggy` in Laravel, and `@artisan-toolbox/qztray` in the frontend when a published npm version is available. For local development, use the workspace Composer path repository and a continuous library build.
- Require PHP 8.5, Laravel 13, and OpenSSL. Core and Maintainer are runtime dependencies installed by Composer; do not remove Maintainer from production requirements while the PHP service implements its version marker.
- Run `php artisan vendor:publish --tag=qztray-config`. Set `config/qztray.php` values `public_key` and `private_key` to the matching complete PEM certificate and unencrypted RSA private key. These are contents, not filenames. Rebuild Laravel's configuration cache after changes.
- Keep the private key server-side. Do not expose it through Inertia props, Ziggy, responses, source control, or frontend bundles.
- Expose `qztray_connector.get_public_key` and `qztray_connector.sign_payload` through Ziggy. The certificate GET is public; signing POST uses `web`, `auth`, and CSRF. Load signing operations from an authenticated Laravel page with its `XSRF-TOKEN` cookie. Apply application-specific authorization when printing is restricted by role.
- Import the default `qztray` instance. `getPrinters()` and printing methods connect automatically. QZ Tray must be installed and running on the user's computer. Use an explicitly selected printer name.
- Use `print({ printer, type, payload, options })` for complete control. Types are `escpos`, `zpl`, `raw`, and `pdf`. Shortcuts `printEscpos`, `printZpl`, `printRaw`, and `printPdf` accept `(printer, payload, options?)`. Printing payloads are strings or readonly string arrays. ESC/POS also accepts mixed text and raw image objects with file or Base64 sources and defaults an omitted image language to ESCPOS; preview byte-buffer support remains broader.
- ESC/POS text defaults to CP850; the payload must select the corresponding printer character table. Plain ZPL detects supported `^CI` declarations unless an encoding is explicitly supplied; ambiguous declarations retain UTF-8. Raw presets enable `forceRaw` by default on macOS. Use the main method for Base64/hex/file flavors or PDF data options.
- Use standalone `renderZpl`, `renderEscpos`, and `renderPdf` for local PNG previews. They return the first image by default and an ordered array with `renderAll: true`. PDF also supports `pageNumber`. ESC/POS previews accept supported Base64 raw image objects; PDF previews accept URLs, Base64, bytes, ArrayBuffers, and Blobs.
- Catch asynchronous errors. Certificate errors propagate with `QzTrayCertificateError`; QZ SDK signing failures currently become a generic `Failed to sign request` error in public print/discovery promises. Do not promise `QzTraySigningError.code` at that public boundary.
- Deploy all files in the frontend `dist/` directory, including worker, WASM, fonts, CMaps, chunks, and license notices. For an externally linked development package, allow its distribution directory in the application Vite server configuration.

## Rules, References, and Templates

Read before executing:

- [Canonical documentation](https://artisantoolbox.wsssoftware.com.br/packages/qztray/)
- [Credential setup](https://artisantoolbox.wsssoftware.com.br/packages/qztray/#configure-printing-credentials)
- [Ziggy setup](https://artisantoolbox.wsssoftware.com.br/packages/qztray/#ziggy-route-configuration)
- [Release readiness](https://artisantoolbox.wsssoftware.com.br/packages/qztray/v1-readiness/)

## Examples

```ts
import qztray, { renderPdf } from '@artisan-toolbox/qztray';

const printers = await qztray.getPrinters();
await qztray.printZpl(selectedPrinter, '^XA^CI28^FO20,20^FDHello^FS^XZ');
const image = await renderPdf('/reports/42.pdf');
```

## Anti-patterns

- do not document package internals here; keep the skill focused on adoption in Laravel apps
- Do not call browser printing through the PHP facade; its PHP service is a container identity and version marker.
- Do not assume a resolved print promise means the printer physically finished the job.
- Do not silently convert binary image data as CP850 text; use bytes or appropriate raw flavors.
- Do not generate missing initialization, character-table, cut, or ZPL commands automatically.
- Do not remove the private key from the server-only boundary or disable application CSRF to make signing work.
