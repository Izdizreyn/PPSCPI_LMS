<?php
require_once __DIR__ . '/../helpers/grades_helper.php';
g_user(['purple_teacher']);
g_json([
    'success' => false,
    'message' => 'Use the advisory room roster to submit student grades.',
], 410);
