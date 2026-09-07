<?php
/**
 * InkMaster Pro - API Router
 * Single entry point for all API requests.
 * Instead of scattered .php files, all requests go through this router.
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Validator.php';

$auth = Auth::getInstance();

// Parse the route from the request URI
// e.g., /backend/api/index.php/auth/login -> auth/login
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/backend/api';
$scriptName = '/backend/api/index.php';

// Remove base path and script name from URI
$path = str_replace($basePath, '', $requestUri);
$path = str_replace($scriptName, '', $path);
$path = trim($path, '/');

// Remove query string
$path = strtok($path, '?');

// Get HTTP method
$method = $_SERVER['REQUEST_METHOD'];

// Route table
$routes = [
    // Auth
    'auth/session' => ['GET', 'auth/session'],
    'auth/login' => ['POST', 'auth/login'],
    'auth/signup' => ['POST', 'auth/signup'],
    'auth/logout' => ['POST', 'auth/logout'],
    
    // Clients
    'clients' => ['GET', 'clients/index'],
    'clients/create' => ['POST', 'clients/create'],
    
    // Add more routes as needed
];

// Simple routing
foreach ($routes as $route => $handler) {
    [$handlerMethod, $handlerFile] = $handler;
    
    if ($path === $route && $method === $handlerMethod) {
        $file = __DIR__ . '/' . $handlerFile . '.php';
        if (file_exists($file)) {
            require_once $file;
            exit;
        }
    }
}

// If no route matched
Response::notFound('API endpoint not found');
