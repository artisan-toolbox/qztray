<?php

declare(strict_types=1);

use ArtisanToolbox\QzTrayConnector\Escpos;
use Illuminate\Support\Facades\File;
use Mike42\Escpos\CapabilityProfile;
use Mike42\Escpos\Printer;

it('generates exact UTF-8 encoded receipt bytes and stable base64 snapshots', function () {
    $receipt = Escpos::create()->text('Olá, João! Ação e café');
    $snapshot = $receipt->render();

    expect($receipt->bytes())->toBe("\x1b@Ol\xa0, Jo\x1bt\x02\xc6o! A\x87\xc6o e caf\x82")
        ->and(base64_decode($snapshot, true))->toBe($receipt->bytes())
        ->and($receipt->render())->toBe($snapshot);
    $receipt->feed()->text('Next')->cut();
    expect($receipt->bytes())->toEndWith("\nNext\x1dVA\x03")
        ->and(base64_decode($snapshot, true))->not->toContain('Next');
});

it('keeps independent buffers and closes abandoned writers without notices', function () {
    $notices = [];
    set_error_handler(function (int $severity, string $message) use (&$notices): bool {
        $notices[] = $message;

        return true;
    });

    try {
        $first = Escpos::create()->text('first');
        $second = Escpos::create()->text('second');
        expect($first->bytes())->toBe("\x1b@first")
            ->and($second->bytes())->toBe("\x1b@second");
        unset($first, $second);
    } finally {
        restore_error_handler();
    }
    expect($notices)->toBe([]);
});

it('preserves explicit formatting and page commands with configurable motion units', function () {
    $writer = Escpos::create(['motionUnits' => 180], 'default')
        ->bold()->initialize()->codepage(2)->italic()->italic(false)
        ->justify('center')->size(2, 3)->reverse()->reverse(false)
        ->beginPage(576, 100)->position(2, 3)->endPage()->cut(true, 0);
    expect($writer->bytes())->toBe("\x1b@\x1bE\x01\x1b@\x1bt\x02\x1b4\x01\x1b4\x00\x1ba\x01\x1d!\x12\x1dB\x01\x1dB\x00\x1dP\xb4\xb4\x1bW\x00\x00\x00\x00\x40\x02\x64\x00\x1bL\x1d$\x03\x00\x1b$\x02\x00\x0c\x1bS\x1dVB\x00");
});

it('offers the upstream printer API with custom profiles without a hardware connector', function () {
    $receipt = Escpos::create(profile: CapabilityProfile::load('simple'))
        ->printer(function (Printer $printer): void {
            $printer->setUnderline(Printer::UNDERLINE_DOUBLE);
            $printer->text('Custom');
        })->raw("\0\xff");
    expect($receipt->bytes())->toBe("\x1b@\x1b-\x02Custom\0\xff");
});

it('wraps paragraphs long words and unicode within configurable columns', function () {
    $receipt = Escpos::create(['columns' => 8]);
    expect($receipt->wrap("Olá café\nlongword123\n\nend"))
        ->toBe(['Olá café', 'longword', '123', '', 'end']);
    expect($receipt->wrappedText('one two three')->bytes())->toBe("\x1b@one two\nthree\n");
});

it('aligns columns and draws boxes without changing printer styles', function () {
    $receipt = Escpos::create(['columns' => 10])->columns('Long product', '9.00')->box('Olá café');
    expect($receipt->bytes())->toBe("\x1b@Long\nprodu\nct    9.00\n+--------+\n|Ol\xa0 caf\x82|\n+--------+\n");
});

it('rejects invalid layout and printer options', function () {
    expect(fn () => Escpos::create(['columns' => 2]))->toThrow(InvalidArgumentException::class)
        ->and(fn () => Escpos::create(['motionUnits' => 256]))->toThrow(InvalidArgumentException::class)
        ->and(fn () => Escpos::create(['unknown' => true]))->toThrow(InvalidArgumentException::class)
        ->and(fn () => Escpos::create()->wrap('text', 0))->toThrow(InvalidArgumentException::class)
        ->and(fn () => Escpos::create()->columns('left', 'right', 4))->toThrow(InvalidArgumentException::class)
        ->and(fn () => Escpos::create()->justify('sideways'))->toThrow(InvalidArgumentException::class)
        ->and(fn () => Escpos::create()->feed(0))->toThrow(InvalidArgumentException::class)
        ->and(fn () => Escpos::create()->size(9, 1))->toThrow(InvalidArgumentException::class)
        ->and(fn () => Escpos::create()->beginPage(0, 1))->toThrow(InvalidArgumentException::class)
        ->and(fn () => Escpos::create()->horizontalRule(1, 25))->toThrow(InvalidArgumentException::class);
});

it('encodes QZ-compatible image strips and horizontal rules', function () {
    $path = tempnam(sys_get_temp_dir(), 'qz-image-');
    file_put_contents($path, "P1\n1 1\n1\n");

    try {
        $receipt = Escpos::create()->image($path)->horizontalRule(2, 6);
        expect($receipt->bytes())->toStartWith("\x1b@\x1b*\x21\x08\x00")
            ->and($receipt->bytes())->toEndWith("\x1bJ\x18\x1b*\x21\x02\x00\0\0\x3f\0\0\x3f");
    } finally {
        File::delete($path);
    }
});

it('rejects images whose padded width exceeds the ESC/POS command limit without appending bytes', function (int $width) {
    $path = tempnam(sys_get_temp_dir(), 'qz-image-width-');
    $chunk = static fn (string $type, string $data): string => pack('N', strlen($data)).$type.$data.pack('N', crc32($type.$data));
    file_put_contents($path, "\x89PNG\r\n\x1a\n"
        .$chunk('IHDR', pack('NNCCCCC', $width, 1, 8, 0, 0, 0, 0))
        .$chunk('IDAT', gzcompress("\0".str_repeat("\0", $width)))
        .$chunk('IEND', ''));
    $widthLimit = extension_loaded('imagick') ? Imagick::getResourceLimit(Imagick::RESOURCETYPE_WIDTH) : null;

    if ($widthLimit !== null) {
        Imagick::setResourceLimit(Imagick::RESOURCETYPE_WIDTH, 32000);
    }

    try {
        $receipt = Escpos::create()->text('Before');
        $before = $receipt->bytes();
        expect(fn () => $receipt->image($path))->toThrow(InvalidArgumentException::class, 'padded image width')
            ->and($receipt->bytes())->toBe($before);
    } finally {
        if ($widthLimit !== null) {
            Imagick::setResourceLimit(Imagick::RESOURCETYPE_WIDTH, $widthLimit);
        }

        File::delete($path);
    }
})->with([65529, 65536]);

it('preserves the receipt when an image cannot be decoded', function (bool $exists) {
    $path = tempnam(sys_get_temp_dir(), 'qz-image-invalid-');
    file_put_contents($path, 'invalid image');

    if (! $exists) {
        File::delete($path);
    }

    try {
        $receipt = Escpos::create()->text('Before');
        $before = $receipt->bytes();

        expect(fn () => $receipt->image($path))->toThrow(Exception::class)
            ->and($receipt->bytes())->toBe($before);
    } finally {
        File::delete($path);
    }
})->with(['unreadable image' => false, 'invalid image' => true]);
