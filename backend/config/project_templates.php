<?php

$labels = ['import_pending' => 'Importación pendiente', 'selection' => 'Selección', 'editing' => 'Edición', 'internal_review' => 'Revisión interna', 'client_review' => 'Revisión del cliente', 'corrections' => 'Correcciones', 'export' => 'Exportación', 'delivered' => 'Entrega completada'];
$recipes = [
    'portrait' => ['Retrato', 'retratos', ['Definir referencias y vestuario', 'Confirmar preferencias de iluminación'], ['Revisar expresiones y variedad de encuadres', 'Comprobar enfoque en los ojos'], ['Revisar tono de piel', 'Comprobar retoque y consistencia']],
    'product' => ['Fotografía de producto', 'fotografías de producto', ['Confirmar listado de productos y variantes', 'Definir fondo y estilismo'], ['Comprobar limpieza y reflejos', 'Cubrir ángulos acordados'], ['Revisar fidelidad de color', 'Comprobar recortes y formatos']],
    'wedding' => ['Boda', 'fotografías de boda', ['Revisar momentos prioritarios con la pareja', 'Confirmar permisos y cronograma facilitado'], ['Revisar cobertura de ceremonia', 'Comprobar retratos y momentos de celebración'], ['Revisar continuidad narrativa', 'Comprobar consistencia entre localizaciones']],
    'event' => ['Evento', 'fotografías del evento', ['Confirmar agenda y acreditaciones', 'Revisar personas y momentos prioritarios'], ['Revisar cobertura de ponentes y ambiente', 'Comprobar planos de contexto y detalle'], ['Preparar selección solicitada', 'Revisar legibilidad y variedad']],
    'music_video' => ['Videoclip', 'montaje del videoclip', ['Revisar concepto y referencias musicales', 'Confirmar autorizaciones y versión del audio'], ['Comprobar sincronía y continuidad', 'Revisar cobertura de interpretación'], ['Revisar ritmo y sincronización', 'Comprobar mezcla y color']],
    'commercial' => ['Vídeo comercial', 'vídeo comercial', ['Revisar objetivos y mensaje de marca', 'Confirmar entregables solicitados'], ['Comprobar mensajes y producto en plano', 'Revisar continuidad de imagen y sonido'], ['Verificar mensajes y grafismos', 'Revisar formatos de entrega acordados']],
    'interview' => ['Entrevista', 'entrevista', ['Preparar preguntas y objetivos', 'Revisar permisos y entorno de grabación'], ['Comprobar inteligibilidad del audio', 'Revisar mirada y planos de recurso'], ['Revisar sentido de las respuestas', 'Comprobar niveles y transcripciones solicitadas']],
    'documentary' => ['Documental', 'documental', ['Revisar enfoque narrativo y fuentes', 'Confirmar accesos y autorizaciones necesarios'], ['Registrar recursos y contexto', 'Revisar continuidad y sonido ambiente'], ['Contrastar narrativa y contexto', 'Revisar créditos y materiales autorizados']],
    'vertical' => ['Contenido vertical', 'vídeo vertical', ['Definir mensaje y canal de publicación', 'Confirmar duración y formatos solicitados'], ['Revisar encuadre vertical y zonas seguras', 'Comprobar legibilidad en móvil'], ['Revisar ritmo y subtítulos solicitados', 'Comprobar exportación vertical']],
];
$templates = [];
foreach ($recipes as $key => [$name, $material, $preparation, $productionChecks, $editingChecks]) {
    $tasks = [
        ['title' => $preparation[0], 'phase' => 'preparation'], ['title' => $preparation[1], 'phase' => 'preparation'],
        ['title' => 'Completar la lista de tomas de '.$name, 'phase' => 'production'],
        ['title' => 'Revisar jornadas y equipo disponible para '.$name, 'phase' => 'production'],
    ];
    $stageTasks = ['import_pending' => 'Confirmar copia local y disponibilidad del material', 'selection' => 'Seleccionar material para '.$material, 'editing' => 'Editar '.$material, 'internal_review' => 'Revisar internamente '.$material, 'client_review' => 'Preparar enlace externo para revisión de '.$material, 'corrections' => 'Resolver correcciones confirmadas de '.$material, 'export' => 'Verificar exportación de '.$material, 'delivered' => 'Confirmar recepción de '.$material];
    $stages = [];
    foreach ($labels as $stageKey => $label) {
        $checks = match ($stageKey) {
            'import_pending' => ['Comprobar copia recuperable fuera de LumaFlow'],
            'selection' => ['Revisar cobertura frente al briefing'],
            'editing' => $editingChecks,
            'internal_review' => ['Revisar calidad técnica antes de compartir'],
            'client_review' => ['Comprobar permisos del proveedor externo'],
            'corrections' => ['Contrastar cambios con las observaciones recibidas'],
            'export' => ['Comprobar reproducción y formatos solicitados'],
            'delivered' => ['Verificar enlace y confirmación de recepción'],
        };
        $stages[] = ['key' => $stageKey, 'label' => $label, 'tasks' => [$stageTasks[$stageKey]], 'checklists' => [['name' => $label.' · '.$name, 'items' => $checks]]];
    }
    $templates[$key] = ['key' => $key, 'name' => $name, 'description' => 'Organización manual de '.$material.'. Sin fechas, equipo ni participantes preasignados.', 'revision' => 0, 'definition' => ['tasks' => $tasks, 'checklists' => [['name' => 'Producción · '.$name, 'items' => $productionChecks]], 'stages' => $stages]];
}

return $templates;
