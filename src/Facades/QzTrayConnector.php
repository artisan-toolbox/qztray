<?php

declare(strict_types=1);

namespace ArtisanToolbox\QzTrayConnector\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * @see \ArtisanToolbox\QzTrayConnector\QzTrayConnector
 */
class QzTrayConnector extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return \ArtisanToolbox\QzTrayConnector\QzTrayConnector::class;
    }
}
