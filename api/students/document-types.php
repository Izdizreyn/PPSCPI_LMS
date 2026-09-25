<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/cors.php';

$types = require __DIR__ . '/../config/document-types.php';

$out = [];
foreach ($types as $value => $meta) {
    $out[] = [
        'value' => $value,
        'label' => $meta['label'],
    ];
}

echo json_encode(['success' => true, 'types' => $out]);