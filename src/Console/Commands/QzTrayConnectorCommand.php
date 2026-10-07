<?php

declare(strict_types=1);

namespace ArtisanToolbox\QzTrayConnector\Console\Commands;

use Illuminate\Console\Command;

class QzTrayConnectorCommand extends Command
{
    /**
     * The command signature.
     */
    protected $signature = 'qztray:placeholder';

    /**
     * The command description.
     */
    protected $description = 'Placeholder Artisan command shipped by the package qztray.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->line('QzTrayConnector placeholder command executed.');

        return self::SUCCESS;
    }
}
