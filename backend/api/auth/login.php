<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
require_once __DIR__ . '/../../bootstrap.php';
use Core\Auth;
use Core\Database;
use Core\Response;
use Core\Validator;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $auth = Auth::getInstance();
    $result = $auth->login($data['email'] ?? '', $data['password'] ?? '');
    
    if ($result['success']) {
        $user = $auth->getCurrentUser();
        Response::success([
            'full_name' => $user['full_name'],
            'email' => $user['email']
        ], 'Login successful');
    } else {
        Response::error($result['message'], 401);
    }
} catch (Exception $e) {
    Response::error('Login failed: ' . $e->getMessage(), 500);
}

