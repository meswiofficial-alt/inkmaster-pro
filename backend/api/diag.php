<?php
/**
 * Quick diagnostic endpoint — tests if PHP is running and DB is accessible
 * URL: https://your-domain.epizy.com/inkmaster_php/backend/api/diag.php
 */
require_once __DIR__ . '/../../config/database.php';

header('Content-Type: application/json');

try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASSWORD, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 10,
    ]);
    
    // Test a simple query
    $stmt = $pdo->query("SELECT 1 as test");
    $result = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => 'Database connection successful',
        'host' => DB_HOST,
        'dbname' => DB_NAME,
        'user' => DB_USER,
        'test_query' => $result,
        'php_version' => PHP_VERSION,
        'setenv_working' => function_exists('getenv') && getenv('DB_HOST')
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $e->getMessage(),
        'host' => DB_HOST,
        'dbname' => DB_NAME,
        'user' => DB_USER,
    ], JSON_PRETTY_PRINT);
}
