<?php

declare(strict_types=1);

namespace ArtisanToolbox\QzTrayConnector;

use ArtisanToolbox\Maintainer\Versionable\Contracts\BeforeVersioning;
use ArtisanToolbox\Maintainer\Versionable\Contracts\Versionable;
use ArtisanToolbox\Maintainer\Versionable\Contracts\WithReadmeHead;
use ArtisanToolbox\Maintainer\Versionable\Readme\Badge;
use ArtisanToolbox\Maintainer\Versionable\Readme\Head;
use Illuminate\Support\Facades\Process;

class QzTrayConnector implements BeforeVersioning, Versionable, WithReadmeHead
{
    public const string VERSION = '1.1.1';

    public function readmeHead(): Head
    {
        return (new Head)
            ->withLogo(src: 'logo/qztray-icon.svg', alt: '', width: 88)
            ->withTitle('QZ Tray Connector')
            ->withDescription('Connect Laravel applications to local printers and preview ZPL labels, ESC/POS receipts, and PDFs.')
            ->addBadge(Badge::releaseVersion('https://github.com/artisan-toolbox/qztray/releases'))
            ->addBadge(Badge::make(
                link: 'https://packagist.org/packages/artisan-toolbox/qztray',
                imgSrc: 'https://img.shields.io/packagist/php-v/artisan-toolbox/qztray.svg?style=flat-square',
                imgAlt: 'PHP from Packagist',
            ))
            ->addBadge(Badge::make(
                link: 'https://github.com/artisan-toolbox/qztray/actions',
                imgSrc: 'https://img.shields.io/github/actions/workflow/status/artisan-toolbox/qztray/tests.yml?branch=1.x&label=Tests&style=flat-square',
                imgAlt: 'Tests',
            ));
    }

    public static function beforeVersioning(string $current, string $next): void
    {
        Process::path(dirname(__DIR__))
            ->forever()
            ->run(['npm', 'run', 'build'])
            ->throw();
    }
}
