<?php
require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

echo json_encode([
    'APP_ENV' => APP_ENV,
    'DB_HOST' => DB_HOST,
    'DB_NAME' => DB_NAME,
    'DB_USER' => DB_USER,
    'DB_PASSWORD_SET' => !empty(DB_PASSWORD),
    'PHP_VERSION' => PHP_VERSION,
    'ERROR_REPORTING' => error_reporting(),
    'DISPLAY_ERRORS' => ini_get('display_errors'),
]);
