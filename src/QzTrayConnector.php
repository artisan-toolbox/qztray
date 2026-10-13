<?php

declare(strict_types=1);

namespace ArtisanToolbox\QzTrayConnector;

use ArtisanToolbox\Maintainer\Versionable\Contracts\BeforeVersioning;
use ArtisanToolbox\Maintainer\Versionable\Contracts\Versionable;
use Illuminate\Support\Facades\Process;

class QzTrayConnector implements BeforeVersioning, Versionable
{
    public const string VERSION = '1.0.0';

    public static function beforeVersioning(string $current, string $next): void
    {
        Process::path(base_path())
            ->forever()
            ->run(['npm', 'run', 'build'])
            ->throw();
    }
}
