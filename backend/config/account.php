<?php

return [
    /*
    | Dias entre solicitar el borrado de la cuenta y la eliminacion definitiva (#67). Durante ese
    | plazo la cuenta funciona y el borrado se puede cancelar.
    */
    'deletion_grace_days' => (int) env('ACCOUNT_DELETION_GRACE_DAYS', 30),
];
