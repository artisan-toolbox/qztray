<?php

declare(strict_types=1);

namespace ArtisanToolbox\QzTrayConnector\Http\Controllers;

use Illuminate\Http\Response;

class GetPublicKey extends Controller
{
    public function __invoke(): Response
    {
        return response('fsafasdas', 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }
}
