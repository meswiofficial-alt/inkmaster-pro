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
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $type = $_GET['type'] ?? 'income';
            $dateFrom = $_GET['date_from'] ?? null;
            $dateTo = $_GET['date_to'] ?? null;
            $limit = (int)($_GET['limit'] ?? 50);
            
            $whereClause = "WHERE t.user_id = ?";
            $params = [$user['id']];
            
            if ($dateFrom && $dateTo) {
                $whereClause .= " AND t.transaction_date BETWEEN ? AND ?";
                $params[] = $dateFrom;
                $params[] = $dateTo;
            }
            
            $whereClause .= " ORDER BY t.transaction_date DESC, t.created_at DESC";
            $whereClause .= " LIMIT ?";
            $params[] = $limit;
            
            $stmt = $db->query(
                "SELECT t.id, t.transaction_type, t.category, t.amount, t.transaction_date, 
                        t.client_id, t.appointment_id, t.payment_method, t.description, t.vendor,
                        c.full_name as client_name
                 FROM transactions t
                 LEFT JOIN clients c ON t.client_id = c.id
                 {$whereClause}",
                $params
            );
            $transactions = $stmt->fetchAll();
            
            foreach ($transactions as &$t) {
                $t['amount'] = (float)$t['amount'];
            }
            
            Response::success($transactions, 'Transactions retrieved');
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Debug logging
            error_log('TRANSACTION POST DATA: ' . print_r($data, true));
            
            $required = ['transaction_type', 'category', 'amount', 'transaction_date'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    error_log("TRANSACTION ERROR: Missing field: {$field}");
                    Response::error("{$field} is required", 422);
                }
            }
            
            if (!in_array($data['transaction_type'], ['income', 'expense'])) {
                Response::error("transaction_type must be 'income' or 'expense'", 422);
            }
            
            $db->query(
                "INSERT INTO transactions (user_id, transaction_type, category, amount, transaction_date, payment_method, description, client_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    $user['id'],
                    $data['transaction_type'],
                    $data['category'],
                    $data['amount'],
                    $data['transaction_date'],
                    $data['payment_method'] ?? 'cash',
                    $data['description'] ?? null,
                    $data['client_id'] ?? null
                ]
            );
            
            $newId = $db->lastInsertId();
            error_log("TRANSACTION INSERTED: ID = {$newId}");
            
            Response::success([
                'id' => $newId,
                'transaction_type' => $data['transaction_type'],
                'category' => $data['category'],
                'amount' => (float)$data['amount'],
                'transaction_date' => $data['transaction_date']
            ], 'Transaction created successfully', 201);
            break;
            
        default:
            Response::error('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}




