<?php

declare(strict_types=1);

namespace ArtisanToolbox\QzTrayConnector\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Description('Placeholder Artisan command shipped by the package qztray.')]
#[Signature('qztray:placeholder')]
class QzTrayConnectorCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->line('QzTrayConnector placeholder command executed.');

        return self::SUCCESS;
    }
}
