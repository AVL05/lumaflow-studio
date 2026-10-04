<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Analytics cache TTL
    |--------------------------------------------------------------------------
    |
    | Segundos que vive un agregado de analytics. La invalidacion por
    | mutacion es la via principal de frescura; el TTL solo acota el peor
    | caso (p. ej. una carrera recalcula/muta). Funciona con cualquier
    | store de Laravel Cache; Redis es opcional, nunca obligatorio.
    |
    */
    'cache_ttl' => (int) env('ANALYTICS_CACHE_TTL', 300),
];
