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
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $auth = Auth::getInstance();
    if (!$auth->isAuthenticated()) {
        Response::unauthorized();
    }
    
    $user = $auth->getCurrentUser();
    $db = Database::getInstance();
    
    $clientId = isset($_GET['client_id']) ? (int)$_GET['client_id'] : 0;
    
    if (!$clientId) {
        Response::error('Client ID is required', 422);
    }
    
    // Get transactions for this client
    $stmt = $db->query(
        "SELECT id, transaction_type, category, amount, transaction_date, 
                payment_method, description, created_at
         FROM transactions 
         WHERE user_id = ? AND client_id = ?
         ORDER BY transaction_date DESC, created_at DESC
         LIMIT 100",
        [$user['id'], $clientId]
    );
    $transactions = $stmt->fetchAll();
    
    // Format amounts
    foreach ($transactions as &$t) {
        $t['amount'] = (float)$t['amount'];
    }
    
    Response::success($transactions, 'Client transactions retrieved');
    
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}
