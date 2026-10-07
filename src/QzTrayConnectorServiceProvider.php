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

        $this->loadViewsFrom(__DIR__.'/../resources/views', 'qztray');

        $this->loadTranslationsFrom(__DIR__.'/../lang', 'qztray');

        if (! $this->app->runningInConsole()) {
            return;
        }

        $this->publishes([
            __DIR__.'/../config/qztray.php' => config_path('qztray.php'),
        ], ['qztray', 'qztray-config']);

        $this->publishes([
            __DIR__.'/../resources/views' => resource_path('views/vendor/qztray'),
        ], ['qztray', 'qztray-views']);

        $this->publishes([
            __DIR__.'/../lang' => $this->app->langPath('vendor/qztray'),
        ], ['qztray', 'qztray-lang']);

        $this->publishes([
            __DIR__.'/../public' => public_path('vendor/qztray'),
        ], ['qztray', 'qztray-assets']);

        $this->publishesMigrations([
            __DIR__.'/../database/migrations' => database_path('migrations'),
        ], ['qztray', 'qztray-migrations']);

        $this->commands([
            QzTrayConnectorCommand::class,
        ]);
    }
}
