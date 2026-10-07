<div align="center">
    <h1>Qz Tray Connector</h1>
</div>

<p align="center">
    <a href="https://packagist.org/packages/artisan-toolbox/qztray"><img src="https://img.shields.io/packagist/v/artisan-toolbox/qztray.svg?style=flat-square" alt="Packagist"></a>
    <a href="https://packagist.org/packages/artisan-toolbox/qztray"><img src="https://img.shields.io/packagist/php-v/artisan-toolbox/qztray.svg?style=flat-square" alt="PHP from Packagist"></a>
    <a href="https://packagist.org/packages/artisan-toolbox/qztray"><img src="https://badge.laravel.cloud/badge/artisan-toolbox/qztray?style=flat" alt="Laravel versions"></a>
    <a href="https://github.com/artisan-toolbox/qztray/actions"><img alt="GitHub Workflow Status (main)" src="https://img.shields.io/github/actions/workflow/status/artisan-toolbox/qztray/tests.yml?branch=main&label=Tests&style=flat-square"></a>
    <a href="https://packagist.org/packages/artisan-toolbox/qztray"><img src="https://img.shields.io/packagist/dt/artisan-toolbox/qztray.svg?style=flat-square" alt="Total Downloads"></a>
</p>

QZ Tray Connector bridges Laravel and your frontend through a unified abstraction for QZ Tray integration.

## Installation

You can install the package via Composer:

```bash
composer require artisan-toolbox/qztray
```

You may publish all of the package's resources at once:

```bash
php artisan vendor:publish --tag="qztray"
```

Or, you may publish each resource individually:

### Publishing the Configuration File

```bash
php artisan vendor:publish --tag="qztray-config"
```

### Publishing and Running the Migrations

```bash
php artisan vendor:publish --tag="qztray-migrations"
php artisan migrate
```

### Publishing the Views

```bash
php artisan vendor:publish --tag="qztray-views"
```

### Publishing the Translations

```bash
php artisan vendor:publish --tag="qztray-lang"
```

### Publishing the Public Assets

```bash
php artisan vendor:publish --tag="qztray-assets"
```

## Usage

<!-- Add a basic usage example here. -->

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information on what has changed recently.

## Contributing

Thank you for considering contributing to Qz Tray Connector! Please review our [contributing guide](.github/CONTRIBUTING.md) to get started.

## Security Vulnerabilities

Please review [our security policy](.github/SECURITY.md) on how to report security vulnerabilities.

## Credits

- [Allan Mariucci Carvalho](https://github.com/artisan-toolbox)
- [All Contributors](../../contributors)

## License

Qz Tray Connector is open-sourced software licensed under the [MIT license](LICENSE.md).
