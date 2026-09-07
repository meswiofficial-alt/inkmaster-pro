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
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $id = $_GET['id'] ?? null;
        
        if ($id) {
            $stmt = $db->query(
                "SELECT id, transaction_type, category, amount, transaction_date, 
                        client_id, appointment_id, payment_method, description, vendor
                 FROM transactions 
                 WHERE id = ? AND user_id = ?",
                [$id, $user['id']]
            );
            $transaction = $stmt->fetch();
            
            if (!$transaction) {
                Response::notFound('Transaction not found');
            }
            
            $transaction['amount'] = (float)$transaction['amount'];
            Response::success($transaction, 'Transaction retrieved');
        } else {
            $data = json_decode(file_get_contents('php://input'), true);
            
            $db->query(
                "INSERT INTO transactions (user_id, transaction_type, category, amount, transaction_date, 
                 client_id, appointment_id, payment_method, description, vendor) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    $user['id'],
                    $data['transaction_type'] ?? 'income',
                    $data['category'] ?? '',
                    $data['amount'] ?? 0,
                    $data['transaction_date'] ?? date('Y-m-d'),
                    $data['client_id'] ?? null,
                    $data['appointment_id'] ?? null,
                    $data['payment_method'] ?? null,
                    $data['description'] ?? null,
                    $data['vendor'] ?? null
                ]
            );
            
            Response::success(['id' => $db->lastInsertId()], 'Transaction created successfully', 201);
        }
    }
    
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}




