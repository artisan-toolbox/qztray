<?php

declare(strict_types=1);

namespace ArtisanToolbox\QzTrayConnector\Tests;

use ArtisanToolbox\QzTrayConnector\QzTrayConnectorServiceProvider;
use Orchestra\Testbench\TestCase as Orchestra;

abstract class TestCase extends Orchestra
{
    protected function getPackageProviders($app): array
    {
        return [
            QzTrayConnectorServiceProvider::class,
        ];
    }
}
