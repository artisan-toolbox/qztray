<?php

declare(strict_types=1);

use ArtisanToolbox\Maintainer\Versionable\Readme\Badge;
use ArtisanToolbox\QzTrayConnector\QzTrayConnector;

it('configures the package logo and badges for the managed README header', function () {
    $head = (new QzTrayConnector)->readmeHead();
    $logo = $head->logo();

    expect($head->title())->toBe('QZ Tray Connector')
        ->and($logo)->toBe(['src' => 'logo/qztray-icon.svg', 'alt' => '', 'width' => 88])
        ->and(dirname(__DIR__, 2).'/logo/qztray-icon.svg')->toBeFile()
        ->and(array_map(static fn (Badge $badge): array => [
            $badge->imgAlt(), $badge->link(), $badge->imgSrc(),
        ], $head->badges()))->toBe([
            ['Release', 'https://github.com/artisan-toolbox/qztray/releases', 'https://img.shields.io/github/v/release/artisan-toolbox/qztray?label=Release&style=flat-square'],
            ['PHP', 'https://atb.dev.br/packages/qztray/compatibility/', 'https://img.shields.io/badge/PHP-%5E8.5-777BB4?style=flat-square'],
            ['Laravel', 'https://atb.dev.br/packages/qztray/compatibility/', 'https://img.shields.io/badge/Laravel-13-FF2D20?style=flat-square'],
            ['Node.js', 'https://atb.dev.br/packages/qztray/compatibility/', 'https://img.shields.io/badge/Node.js-%5E20.19.0%20%7C%7C%20%5E22.18.0%20%7C%7C%20%3E%3D24.11.0-339933?style=flat-square'],
            ['Tests', 'https://github.com/artisan-toolbox/qztray/actions/workflows/tests.yml?query=branch%3A1.x', 'https://img.shields.io/github/actions/workflow/status/artisan-toolbox/qztray/tests.yml?branch=1.x&label=Tests&style=flat-square'],
            ['Docs', 'https://atb.dev.br/packages/qztray/', 'https://img.shields.io/badge/Docs-Read-blue?style=flat-square'],
        ]);
});
