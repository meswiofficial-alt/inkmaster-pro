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
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
            $search = $_GET['search'] ?? '';
            $status = $_GET['status'] ?? 'all';
            
            $where = '';
            $params = [$user['id']];
            
            if ($search) {
                $where .= " AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)";
                $params = array_merge($params, ["%$search%", "%$search%", "%$search%"]);
            }
            
            if ($status === 'active') {
                $where .= " AND is_active = 1";
            } elseif ($status === 'inactive') {
                $where .= " AND is_active = 0";
            }
            
            $stmt = $db->query(
                "SELECT c.id, c.full_name, c.email, c.phone, c.avatar_url, c.is_active,
                        COUNT(a.id) as appointment_count,
                        MAX(a.appointment_date) as last_visit,
                        COALESCE((
                            SELECT SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE -t.amount END)
                            FROM transactions t
                            WHERE t.client_id = c.id AND t.user_id = ?
                        ), 0) as outstanding_balance
                 FROM clients c
                 LEFT JOIN appointments a ON a.client_id = c.id AND a.status = 'completed'
                 WHERE c.user_id = ?{$where}
                 GROUP BY c.id
                 ORDER BY c.full_name ASC
                 LIMIT 100",
                array_merge([$user['id']], $params)
            );
            $clients = $stmt->fetchAll();
            
            foreach ($clients as &$client) {
                $client['avatar_url'] = $client['avatar_url'];
                $client['appointment_count'] = (int)$client['appointment_count'];
                $client['last_visit'] = $client['last_visit'] ?? null;
                $client['outstanding_balance'] = (float)$client['outstanding_balance'];
            }
            
            Response::success($clients, 'Clients retrieved');
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $required = ['full_name', 'phone'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    Response::error("{$field} is required", 422);
                }
            }
            
            $db->query(
                "INSERT INTO clients (user_id, full_name, phone, email, tattoo_preferences, address) 
                 VALUES (?, ?, ?, ?, ?, ?)",
                [
                    $user['id'],
                    $data['full_name'],
                    $data['phone'],
                    $data['email'] ?? null,
                    $data['tattoo_preferences'] ?? null,
                    $data['address'] ?? null
                ]
            );
            
            Response::success(['id' => $db->lastInsertId()], 'Client created successfully', 201);
            break;
            
        default:
            Response::error('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}




