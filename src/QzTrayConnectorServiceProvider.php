<?php

declare(strict_types=1);

namespace ArtisanToolbox\QzTrayConnector;

use ArtisanToolbox\QzTrayConnector\Console\Commands\QzTrayConnectorCommand;
use Illuminate\Support\ServiceProvider;

class QzTrayConnectorServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/qztray.php', 'qztray');

        $this->app->singleton(QzTrayConnector::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../routes/qztray.php');

        if (! $this->app->runningInConsole()) {
            return;
        }

        $this->publishes([
            __DIR__.'/../config/qztray.php' => config_path('qztray.php'),
        ], ['qztray', 'qztray-config']);

        $this->commands([
            QzTrayConnectorCommand::class,
        ]);
    }
}
