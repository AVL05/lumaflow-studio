<?php

return [
    /*
    |--------------------------------------------------------------------------
    | API throttle per minute (authenticated group)
    |--------------------------------------------------------------------------
    |
    | Techo anti-abuso del grupo autenticado. El valor por defecto protege
    | produccion; la suite E2E lo eleva por entorno porque ejecuta once
    | recorridos completos (cientos de peticiones por usuario) en ~1 min,
    | un patron imposible en uso humano normal y que agotaria el budget.
    |
    */
    'throttle_per_minute' => (int) env('API_THROTTLE_PER_MINUTE', 180),
];
