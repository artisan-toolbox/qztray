<?php

declare(strict_types=1);

namespace ArtisanToolbox\QzTrayConnector;

use InvalidArgumentException;
use LogicException;
use Mike42\Escpos\CapabilityProfile;
use Mike42\Escpos\EscposImage;
use Mike42\Escpos\PrintConnectors\MemoryPrintConnector;
use Mike42\Escpos\Printer;
use Throwable;

final class Escpos
{
    private readonly MemoryPrintConnector $connector;

    private readonly Printer $printer;

    private readonly int $columns;

    private readonly int $motionUnits;

    /** @param array{columns?: int, motionUnits?: int} $options */
    private function __construct(array $options, CapabilityProfile|string|null $profile)
    {
        throw_unless(class_exists(Printer::class), LogicException::class, 'ESC/POS generation requires mike42/escpos-php. Run composer require mike42/escpos-php:^5.0.');

        $this->columns = $options['columns'] ?? 48;
        $this->motionUnits = $options['motionUnits'] ?? 203;

        throw_if($this->columns < 3 || $this->motionUnits < 1 || $this->motionUnits > 255, InvalidArgumentException::class, 'columns must be at least 3 and motionUnits must be between 1 and 255.');

        throw_if(array_diff(array_keys($options), ['columns', 'motionUnits']) !== [], InvalidArgumentException::class, 'Supported ESC/POS options are columns and motionUnits.');
        $this->connector = new MemoryPrintConnector;

        try {
            $this->printer = new Printer($this->connector, is_string($profile) ? CapabilityProfile::load($profile) : $profile);
        } catch (Throwable $exception) {
            $this->connector->finalize();

            throw $exception;
        }
    }

    public function __destruct()
    {
        $this->printer->close();
    }

    /** @param array{columns?: int, motionUnits?: int} $options */
    public static function create(array $options = [], CapabilityProfile|string|null $profile = null): self
    {
        return new self($options, $profile);
    }

    /** @param callable(Printer): void $callback */
    public function printer(callable $callback): self
    {
        $callback($this->printer);

        return $this;
    }

    public function raw(string $bytes): self
    {
        $this->connector->write($bytes);

        return $this;
    }

    public function bytes(): string
    {
        return $this->connector->getData();
    }

    /**
     * Wrap UTF-8 text by grapheme count, preserving explicit line breaks.
     * Layout assumes one printer column per grapheme and the current font size.
     *
     * @return list<string>
     */
    public function wrap(string $text, ?int $width = null): array
    {
        $width ??= $this->columns;

        throw_if($width < 1, InvalidArgumentException::class, 'Wrap width must be positive.');
        $this->length($text);
        $lines = [];
        foreach (preg_split('/\\R/u', $text) ?: [''] as $paragraph) {
            $line = '';
            foreach (preg_split('/\\s+/u', trim($paragraph), flags: PREG_SPLIT_NO_EMPTY) ?: [] as $word) {
                if ($line !== '' && $this->length($line.' '.$word) <= $width) {
                    $line .= ' '.$word;

                    continue;
                }

                if ($line !== '') {
                    $lines[] = $line;
                    $line = '';
                }
                preg_match_all('/\\X/u', $word, $characters);
                $chunks = array_chunk($characters[0], $width);
                foreach ($chunks as $index => $chunk) {
                    if ($index === count($chunks) - 1) {
                        $line = implode('', $chunk);
                    } else {
                        $lines[] = implode('', $chunk);
                    }
                }
            }
            $lines[] = rtrim($line);
        }

        return $lines;
    }

    public function wrappedText(string $text, ?int $width = null): self
    {
        return $this->text(implode("\n", $this->wrap($text, $width))."\n");
    }

    public function columns(string $left, string $right, ?int $width = null): self
    {
        $width ??= $this->columns;
        $rightWidth = $this->length($right);

        throw_if($width < 3 || $rightWidth > $width - 2 || str_contains($right, "\n") || str_contains($right, "\r"), InvalidArgumentException::class, 'The right column must fit on one line with room for the left column.');
        $lines = $this->wrap($left, $width - $rightWidth - 1);
        $last = array_pop($lines) ?? '';
        foreach ($lines as $line) {
            $this->text($line."\n");
        }

        return $this->text($last.str_repeat(' ', $width - $rightWidth - $this->length($last)).$right."\n");
    }

    public function box(string $text, ?int $width = null): self
    {
        $width ??= $this->columns;

        throw_if($width < 3, InvalidArgumentException::class, 'Box width must be at least 3 columns.');
        $border = '+'.str_repeat('-', $width - 2)."+\n";
        $this->text($border);
        foreach ($this->wrap($text, $width - 2) as $line) {
            $this->text('|'.$line.str_repeat(' ', $width - 2 - $this->length($line))."|\n");
        }

        return $this->text($border);
    }

    private function length(string $text): int
    {
        $length = preg_match_all('/\\X/u', $text);

        throw_if($length === false, InvalidArgumentException::class, 'Receipt layout requires valid UTF-8 text.');

        return $length;
    }

    public function initialize(): self
    {
        $this->printer->initialize();

        return $this;
    }

    public function codepage(int $table): self
    {
        $this->printer->selectCharacterTable($table);

        return $this;
    }

    public function image(string $path): self
    {
        $dimensions = is_file($path) && is_readable($path) ? @getimagesize($path) : false;

        if ($dimensions !== false) {
            $this->validateImageWidth((int) ceil($dimensions[0] / 8) * 8);
        }

        $image = EscposImage::load($path, false);
        $strips = $image->toColumnFormat(true);
        $width = $image->getWidthBytes() * 8;
        $this->validateImageWidth($width);

        $header = "\x1b*\x21".pack('v', $width);

        foreach ($strips as $strip) {
            $this->connector->write($header.str_pad($strip, $width * 3, "\0")."\x1bJ\x18");
        }

        return $this;
    }

    private function validateImageWidth(int $width): void
    {
        throw_if($width < 1 || $width > 65535, InvalidArgumentException::class, 'The padded image width must be between 1 and 65535 dots.');
    }

    public function horizontalRule(int $width, int $thickness = 6): self
    {
        throw_if($width < 1 || $width > 65535 || $thickness < 1 || $thickness > 24, InvalidArgumentException::class, 'Rule width must be 1-65535 dots and thickness 1-24 dots.');

        $column = str_repeat('0', 24 - $thickness).str_repeat('1', $thickness);
        $bytes = substr(pack('N', bindec($column)), 1);
        $this->connector->write("\x1b*\x21".pack('v', $width).str_repeat($bytes, $width));

        return $this;
    }

    public function text(string $text): self
    {
        $this->printer->text($text);

        return $this;
    }

    public function feed(int $lines = 1): self
    {
        $this->printer->feed($lines);

        return $this;
    }

    public function bold(bool $enabled = true): self
    {
        $this->printer->setEmphasis($enabled);

        return $this;
    }

    public function italic(bool $enabled = true): self
    {
        $this->connector->write("\x1b4".($enabled ? "\x01" : "\x00"));

        return $this;
    }

    public function justify(string $alignment): self
    {
        $this->printer->setJustification(match ($alignment) {
            'left' => Printer::JUSTIFY_LEFT,
            'center' => Printer::JUSTIFY_CENTER,
            'right' => Printer::JUSTIFY_RIGHT,
            default => throw new InvalidArgumentException('Alignment must be left, center or right.'),
        });

        return $this;
    }

    public function size(int $width, int $height): self
    {
        $this->printer->setTextSize($width, $height);

        return $this;
    }

    public function beginPage(int $width, int $height): self
    {
        throw_if($width < 1 || $width > 65535 || $height < 1 || $height > 65535, InvalidArgumentException::class, 'Page dimensions must be between 1 and 65535 dots.');

        $this->connector->write("\x1dP".chr($this->motionUnits).chr($this->motionUnits));
        $this->pageArea(0, 0, $width, $height);
        $this->connector->write("\x1bL");

        return $this;
    }

    public function pageArea(int $x, int $y, int $width, int $height): self
    {
        throw_if($x < 0 || $x > 65535 || $y < 0 || $y > 65535
            || $width < 1 || $width > 65535 || $height < 1 || $height > 65535, InvalidArgumentException::class, 'Invalid page area coordinates or dimensions.');

        $this->connector->write("\x1bW".pack('vvvv', $x, $y, $width, $height));

        return $this;
    }

    public function position(int $x, int $y): self
    {
        throw_if($x < 0 || $x > 65535 || $y < 0 || $y > 65535, InvalidArgumentException::class, 'Page coordinates must be between 0 and 65535 dots.');

        $this->connector->write("\x1d$".pack('v', $y)."\x1b$".pack('v', $x));

        return $this;
    }

    public function endPage(): self
    {
        $this->connector->write("\x0c\x1bS");

        return $this;
    }

    public function qrCode(string $payload, int $size = 5): self
    {
        $this->printer->qrCode($payload, Printer::QR_ECLEVEL_M, $size);

        return $this;
    }

    public function reverse(bool $enabled = true): self
    {
        $this->printer->setReverseColors($enabled);

        return $this;
    }

    public function cut(bool $partial = false, int $feedLines = 3): self
    {
        $this->printer->cut($partial ? Printer::CUT_PARTIAL : Printer::CUT_FULL, $feedLines);

        return $this;
    }

    public function render(): string
    {
        return base64_encode($this->bytes());
    }
}
