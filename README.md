<!-- MAINTAINER:README_HEAD:START -->
<div id="maintainer-title" align="center">
    <img src="logo/qztray-icon.svg" alt="" width="88">
    <h1>QZ Tray Connector</h1>
</div>

<p id="maintainer-badges" align="center">
<a href="https://github.com/artisan-toolbox/qztray/releases"><img src="https://img.shields.io/badge/version-1.1.1-blue?style=flat-square" alt="version"></a>
<a href="https://packagist.org/packages/artisan-toolbox/qztray"><img src="https://img.shields.io/packagist/php-v/artisan-toolbox/qztray.svg?style=flat-square" alt="PHP from Packagist"></a>
<a href="https://github.com/artisan-toolbox/qztray/actions"><img src="https://img.shields.io/github/actions/workflow/status/artisan-toolbox/qztray/tests.yml?branch=1.x&amp;label=Tests&amp;style=flat-square" alt="Tests"></a>
</p>

<p id="maintainer-description" align="center">
    Connect Laravel applications to local printers and preview ZPL labels, ESC/POS receipts, and PDFs.
</p>
<!-- MAINTAINER:README_HEAD:END -->

## Installation

Install the connector and Ziggy through Composer. Then install the frontend package from the Composer vendor directory.

```bash
composer require artisan-toolbox/qztray tightenco/ziggy:^2.0
npm install ./vendor/artisan-toolbox/qztray
```

The Composer distribution includes the compiled frontend and renderer assets; no npm registry publication or library build in the application is required.

Requires PHP 8.5 with OpenSSL and Laravel 13. TypeScript applications use Vite with `"moduleResolution": "bundler"`. QZ Tray must run on the user's computer for printing. See the [1.x compatibility and API limits](https://artisantoolbox.wsssoftware.com.br/packages/qztray/compatibility/).

## Usage

Publish the credential configuration from your Laravel application's root:

```bash
php artisan vendor:publish --tag=qztray-config
```

Set `public_key` to your complete PEM certificate and `private_key` to its matching PEM private key in `config/qztray.php`. See the [credential setup guide](https://artisantoolbox.wsssoftware.com.br/packages/qztray/#configure-printing-credentials) for the full example and configuration cache steps. Connection, printer discovery, ESC/POS, ZPL, generic raw, PDF printing, and local ZPL, ESC/POS, and PDF previews are available in the 1.x series.

The frontend package exports a shared `QzTray` instance:

```ts
import qztray from '@artisan-toolbox/qztray';

await qztray.connect();
console.log(qztray.isConnected());
```

The application must use Ziggy (`tightenco/ziggy` and `ziggy-js`) and expose the connector's named routes to the frontend. Start with the [quickstart and API overview](https://artisantoolbox.wsssoftware.com.br/packages/qztray/#quickstart); detailed printing, preview, error, and development guides live in the canonical documentation.

## Resources

- [Documentation](https://artisantoolbox.wsssoftware.com.br/packages/qztray/)
- [Changelog](CHANGELOG.md)
- [Contributing](.github/CONTRIBUTING.md)
- [Security policy](.github/SECURITY.md)
- [License](LICENSE.md)
