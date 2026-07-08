<?php

return [
    'url' => env('OLLAMA_URL', 'http://127.0.0.1:11434'),
    'model' => env('OLLAMA_MODEL', 'llama3.1'),
    'timeout' => (int) env('OLLAMA_TIMEOUT', 45),
    'max_context' => (int) env('OLLAMA_MAX_CONTEXT', 12000),
];
