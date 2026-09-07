<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    require_once __DIR__ . '/../bootstrap.php';
    
    echo json_encode([
        'success' => true,
        'message' => 'Bootstrap loaded successfully',
        'APP_ENV' => APP_ENV,
        'DB_HOST' => DB_HOST,
        'DB_NAME' => DB_NAME,
        'DB_USER' => DB_USER,
        'PHP_VERSION' => PHP_VERSION,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Bootstrap failed: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
    ]);
}
