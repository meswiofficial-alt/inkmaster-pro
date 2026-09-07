<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
require_once __DIR__ . '/../../bootstrap.php';

use Core\Auth;
use Core\Database;
use Core\Response;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

try {
    $auth = Auth::getInstance();
    
    if (!$auth->isAuthenticated()) {
        Response::success([
            'authenticated' => false
        ], 'Not authenticated');
    }
    
    $user = $auth->getCurrentUser();
    
    Response::success([
        'authenticated' => true,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'full_name' => $user['full_name']
        ]
    ], 'Session active');
} catch (Exception $e) {
    Response::success([
        'authenticated' => false
    ], 'Session check complete');
}




