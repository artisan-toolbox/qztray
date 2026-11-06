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
    public const string VERSION = '1.2.0';

    public function readmeHead(): Head
    {
        return (new Head)
            ->withLogo(src: 'logo/qztray-icon.svg', alt: '', width: 88)
            ->withTitle('QZ Tray Connector')
            ->withDescription('Connect Laravel applications to local printers and preview ZPL labels, ESC/POS receipts, and PDFs.')
            ->addBadge(Badge::make(
                link: 'https://github.com/artisan-toolbox/qztray/releases',
                imgSrc: 'https://img.shields.io/github/v/release/artisan-toolbox/qztray?label=Release&style=flat-square',
                imgAlt: 'Release',
            ))
            ->addBadge(Badge::make(
                link: 'https://atb.dev.br/packages/qztray/compatibility/',
                imgSrc: 'https://img.shields.io/badge/PHP-%5E8.5-777BB4?style=flat-square',
                imgAlt: 'PHP',
            ))
            ->addBadge(Badge::make(
                link: 'https://atb.dev.br/packages/qztray/compatibility/',
                imgSrc: 'https://img.shields.io/badge/Laravel-13-FF2D20?style=flat-square',
                imgAlt: 'Laravel',
            ))
            ->addBadge(Badge::make(
                link: 'https://atb.dev.br/packages/qztray/compatibility/',
                imgSrc: 'https://img.shields.io/badge/Node.js-%5E20.19.0%20%7C%7C%20%5E22.18.0%20%7C%7C%20%3E%3D24.11.0-339933?style=flat-square',
                imgAlt: 'Node.js',
            ))
            ->addBadge(Badge::make(
                link: 'https://github.com/artisan-toolbox/qztray/actions/workflows/tests.yml?query=branch%3A1.x',
                imgSrc: 'https://img.shields.io/github/actions/workflow/status/artisan-toolbox/qztray/tests.yml?branch=1.x&label=Tests&style=flat-square',
                imgAlt: 'Tests',
            ))
            ->addBadge(Badge::make(
                link: 'https://atb.dev.br/packages/qztray/',
                imgSrc: 'https://img.shields.io/badge/Docs-Read-blue?style=flat-square',
                imgAlt: 'Docs',
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
