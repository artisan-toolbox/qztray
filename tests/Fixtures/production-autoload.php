<?php

declare(strict_types=1);
use ArtisanToolbox\QzTrayConnector\Escpos;
use ArtisanToolbox\QzTrayConnector\QzTrayConnector;
use Composer\Autoload\ClassLoader;
use Mike42\Escpos\Printer;

require __DIR__.'/../../vendor/composer/ClassLoader.php';

$root = dirname(__DIR__, 2);
$composer = json_decode(file_get_contents($root.'/composer.json'), true, flags: JSON_THROW_ON_ERROR);
$loader = new ClassLoader;
$files = [];

foreach ($composer['autoload']['psr-4'] as $prefix => $path) {
    $loader->addPsr4($prefix, $root.'/'.$path);
}

foreach (array_keys($composer['require']) as $package) {
    $directory = $root.'/vendor/'.$package;

    if (! is_file($directory.'/composer.json') && str_starts_with($package, 'illuminate/')) {
        $component = str_replace(' ', '', ucwords(str_replace('-', ' ', substr($package, 11))));
        $directory = $root.'/vendor/laravel/framework/src/Illuminate/'.$component;
    }

    if (! is_file($directory.'/composer.json')) {
        continue;
    }

    $metadata = json_decode(file_get_contents($directory.'/composer.json'), true, flags: JSON_THROW_ON_ERROR);

    if ($metadata['name'] !== $package) {
        continue;
    }

    foreach ($metadata['autoload']['psr-4'] ?? [] as $prefix => $paths) {
        foreach ((array) $paths as $path) {
            $loader->addPsr4($prefix, $directory.'/'.$path);
        }
    }

    foreach ($metadata['autoload']['files'] ?? [] as $file) {
        $files[] = $directory.'/'.$file;
    }
}

$loader->register();

foreach ($files as $file) {
    require_once $file;
}

$service = new QzTrayConnector;

if (($argv[1] ?? null) === 'helpers') {
    echo json_encode([
        'throw_if' => function_exists('throw_if'),
        'throw_unless' => function_exists('throw_unless'),
        'app' => function_exists('app'),
        'escpos' => class_exists(Printer::class),
    ], JSON_THROW_ON_ERROR);
} elseif (($argv[1] ?? null) === 'escpos') {
    try {
        Escpos::create();

        throw new RuntimeException('The optional ESC/POS dependency was unexpectedly available.');
    } catch (LogicException $exception) {
        echo $exception->getMessage();
    }
} else {
    echo get_class($service);
}
