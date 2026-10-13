<?php

declare(strict_types=1);
use ArtisanToolbox\QzTrayConnector\QzTrayConnector;
use Composer\Autoload\ClassLoader;

require __DIR__.'/../../vendor/composer/ClassLoader.php';

$root = dirname(__DIR__, 2);
$composer = json_decode(file_get_contents($root.'/composer.json'), true, flags: JSON_THROW_ON_ERROR);
$loader = new ClassLoader;

foreach ($composer['autoload']['psr-4'] as $prefix => $path) {
    $loader->addPsr4($prefix, $root.'/'.$path);
}

foreach (array_keys($composer['require']) as $package) {
    $directory = $root.'/vendor/'.$package;

    if (! is_file($directory.'/composer.json')) {
        continue;
    }

    $metadata = json_decode(file_get_contents($directory.'/composer.json'), true, flags: JSON_THROW_ON_ERROR);

    foreach ($metadata['autoload']['psr-4'] ?? [] as $prefix => $paths) {
        foreach ((array) $paths as $path) {
            $loader->addPsr4($prefix, $directory.'/'.$path);
        }
    }
}

$loader->register();
$service = new QzTrayConnector;

echo get_class($service);
