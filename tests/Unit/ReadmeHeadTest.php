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
        ->and(array_map(static fn (Badge $badge): string => $badge->link(), $head->badges()))->toBe([
            'https://github.com/artisan-toolbox/qztray/releases',
            'https://packagist.org/packages/artisan-toolbox/qztray',
            'https://github.com/artisan-toolbox/qztray/actions',
        ]);
});
