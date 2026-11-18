---
name: qztray-development
description: >
  Configure QZ Tray printing, generate server-side ESC/POS receipts, and preview PDF,
  ESC/POS, or ZPL print documents in Laravel applications.
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

- Install `artisan-toolbox/qztray` and `tightenco/ziggy` through Composer, then run `npm install ./vendor/artisan-toolbox/qztray` from the application root. Composer ships the compiled dist directory; the frontend is not published to npm. Run Composer before npm in deployments. For local package changes, use a Composer path repository and a continuous library build.
- Require PHP 8.5, Laravel 13, and OpenSSL. Core and Maintainer are runtime dependencies installed by Composer; do not remove Maintainer from production requirements while the PHP service implements its version marker.
- Run `php artisan vendor:publish --tag=qztray-config`. Set `config/qztray.php` values `public_key` and `private_key` to the matching complete PEM certificate and unencrypted RSA private key. These are contents, not filenames. Rebuild Laravel's configuration cache after changes.
- Keep the private key server-side. Do not expose it through Inertia props, Ziggy, responses, source control, or frontend bundles.
- Expose `qztray_connector.get_public_key` and `qztray_connector.sign_payload` through Ziggy. The certificate GET is public; signing POST uses `web`, `auth`, and CSRF. Load signing operations from an authenticated Laravel page with its `XSRF-TOKEN` cookie. Apply application-specific authorization when printing is restricted by role.
- Import the default `qztray` instance. `getPrinters()` and printing methods connect automatically. QZ Tray must be installed and running on the user's computer. Use an explicitly selected printer name.
- Use `print({ printer, type, payload, options })` for complete control. Types are `escpos`, `zpl`, `raw`, and `pdf`. Shortcuts `printEscpos`, `printZpl`, `printRaw`, and `printPdf` accept `(printer, payload, options?)`. Printing payloads are strings or readonly string arrays. ESC/POS also accepts mixed text and raw image objects with file or Base64 sources and defaults an omitted image language to ESCPOS; preview byte-buffer support remains broader.
- ESC/POS text defaults to CP850; the payload must select the corresponding printer character table. Plain ZPL detects supported `^CI` declarations unless an encoding is explicitly supplied; ambiguous declarations retain UTF-8. Raw presets enable `forceRaw` by default on macOS. Use the main method for Base64/hex/file flavors or PDF data options.
- Use standalone `renderZpl`, `renderEscpos`, and `renderPdf` for local PNG previews. They return the first image by default and an ordered array with `renderAll: true`. PDF also supports `pageNumber`. ESC/POS previews accept supported Base64 raw image objects; PDF previews accept URLs, Base64, bytes, ArrayBuffers, and Blobs.
- Use `renderPrintRequest(document, previewOptions?)` when previewing the same `QzTrayPrintDocument` later submitted to `print({ ...document, printer })`. The document omits only `printer` and retains the discriminated payload, flavor, print options, and PDF data options. The adapter returns all PNG pages, supports PDF file/Base64, ESC/POS mixed image parts, and plain/hex/Base64/file raw transports. The raw type rejects with an explanation because its page language is unknown.
- Call `preparePrintDocument(document, { requestInit? })` before a preview-first workflow. It copies the document and downloads file payloads and mixed ESC/POS image file parts once as Base64. Keep the returned document for both `renderPrintRequest` and `print`; this preserves the approved bytes after URLs change or blob URLs are revoked. Defaults use same-origin browser credentials and CORS rules. Direct `print` file handling stays unchanged. Preparation does not connect to QZ Tray.
- Pass preview dimensions explicitly with `{ escpos: { widthDots: 576 }, zpl: { widthMm: 105, heightMm: 155 } }` for those example printer sizes. Preview dimensions do not configure hardware. Defaults match the standalone renderers. File payloads use same-origin credentials and browser CORS rules, with optional `requestInit`. All rendering stays local after downloading document sources and bundled renderer assets.
- PDF document previews honor `dataOptions.pageRanges`, such as `1,3-5`, once in document order. Nondefault `pageWidth`, `pageHeight`, `ignoreTransparency`, and `altFontRendering` are rejected because the local PDF renderer cannot reproduce those QZ transformations. Standalone `renderPdf` also accepts `pageRanges` with `renderAll: true`. Document PDF previews also reject print `options.bounds`, nonzero print `options.rotation`, and preview-only `password`. Use ranges without spaces around the hyphen, such as `1,3-5`; spaces around commas are accepted. Document ESC/POS previews derive text encoding from `document.options.encoding` with a CP850 default. Set encoding on the document, not `previewOptions.escpos`. Standalone renderers retain their own encoding and password options. ZPL binary transports infer supported `^CI` text encodings or use a string `options.encoding`.
- Install optional `mike42/escpos-php:^5.0` through Composer to generate receipts on the server. PDF-only applications do not need it. `ArtisanToolbox\QzTrayConnector\Escpos::create(['columns' => 48, 'motionUnits' => 203], profile: 'default')` creates a memory-only writer. A profile ID or an upstream `CapabilityProfile` is supported. `render()` returns Base64 and `bytes()` returns the exact binary snapshot. Neither method closes or clears the writer.
- Receipt helpers include `text`, `wrappedText`, `wrap`, `columns`, `box`, `image`, `horizontalRule`, styles, character tables, page coordinates, QR codes, feeds, and cuts. `text` adds no newline. `wrappedText`, `columns`, and `box` add line endings. Layout uses grapheme counts and assumes one column per grapheme at the selected font size. Set the effective column count when changing text size. ASCII box borders work across profiles. Image decoding follows the upstream GD, Imagick, or native decoder support. Byte-padded image width must be 1-65535 dots. An invalid width appends no image bytes.
- Use `printer(function (Printer $printer): void { ... })` for the full upstream API and `raw($bytes)` for device commands. The writer owns its memory connector and printer lifecycle. Do not close the printer or finalize its connector inside the callback. Profile support and real printer capabilities still govern commands. The helper never opens a hardware connection.
- Send a backend `Escpos::render()` result with `type: 'escpos', flavor: 'base64'` to both preview and print. The public print default remains `plain`; Base64 must be explicit to prevent accidental text re-encoding.
- ZPL preview initialization retries after a failed WASM download or compilation. Once initialization succeeds, use the same WASM asset URL for later calls.
- Catch asynchronous errors. Certificate errors propagate with `QzTrayCertificateError`; QZ SDK signing failures currently become a generic `Failed to sign request` error in public print/discovery promises. Do not promise `QzTraySigningError.code` at that public boundary.
- Deploy all files in the frontend `dist/` directory, including worker, WASM, fonts, CMaps, chunks, and license notices. For an externally linked development package, allow its distribution directory in the application Vite server configuration.

## Rules, References, and Templates

Read before executing:

- [Canonical documentation](https://atb.dev.br/packages/qztray/)
- [Credential setup](https://atb.dev.br/packages/qztray/#configure-printing-credentials)
- [Ziggy setup](https://atb.dev.br/packages/qztray/#ziggy-route-configuration)
- [Release readiness](https://atb.dev.br/packages/qztray/v1-readiness/)

## Examples

```ts
import qztray, { preparePrintDocument, renderPrintRequest } from '@artisan-toolbox/qztray';

const receiptBase64 = 'G0BIZWxsbyB3b3JsZAo=';
const document = await preparePrintDocument({ type: 'escpos', flavor: 'base64', payload: receiptBase64 });
const pages = await renderPrintRequest(document, { escpos: { widthDots: 576 } });
async function printApprovedReceipt(selectedPrinter: string) {
    await qztray.print({ ...document, printer: selectedPrinter });
}
```

```php
use ArtisanToolbox\QzTrayConnector\Escpos;
use Mike42\Escpos\Printer;

$receipt = Escpos::create(['columns' => 48])
    ->bold()->text("Example shop\n")->bold(false)
    ->columns('Coffee', '4.50')
    ->box('Thank you')
    ->printer(function (Printer $printer): void {
        $printer->setUnderline(Printer::UNDERLINE_SINGLE);
    })
    ->feed()->cut()->render();
```

Show the PNG pages and let the user choose a printer before calling `printApprovedReceipt`. Preparing and rendering the receipt does not connect to QZ Tray.

The PHP example returns Base64 receipt commands for JSON transport. It does not print or contact QZ Tray.

## Anti-patterns

- do not document package internals here; keep the skill focused on adoption in Laravel apps
- Do not call browser printing through the PHP facade; its PHP service is a container identity and version marker.
- Do not assume a resolved print promise means the printer physically finished the job.
- Do not silently convert binary image data as CP850 text; use bytes or appropriate raw flavors.
- Do not generate missing initialization, character-table, cut, or ZPL commands automatically.
- Do not remove the private key from the server-only boundary or disable application CSRF to make signing work.
