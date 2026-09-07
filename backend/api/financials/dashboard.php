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
    
    $monthStart = date('Y-m-01');
    $monthEnd = date('Y-m-t');
    
    $stmt = $db->query(
        "SELECT 
            COUNT(DISTINCT c.id) as total_clients,
            SUM(CASE WHEN a.appointment_date = CURDATE() AND a.status != 'cancelled' THEN 1 ELSE 0 END) as today_appointments,
            COALESCE(SUM(CASE WHEN t.transaction_type = 'income' AND MONTH(t.transaction_date) = MONTH(CURDATE()) THEN t.amount ELSE 0 END), 0) as monthly_revenue,
            SUM(CASE WHEN i.quantity_on_hand <= i.reorder_level AND i.is_active = 1 THEN 1 ELSE 0 END) as low_stock_items,
            COUNT(DISTINCT t.id) as total_transactions
          FROM users u
          LEFT JOIN clients c ON c.user_id = u.id AND c.is_active = 1
          LEFT JOIN appointments a ON a.user_id = u.id AND a.appointment_date = CURDATE() AND a.status != 'cancelled'
          LEFT JOIN transactions t ON t.user_id = u.id
          LEFT JOIN inventory_items i ON i.user_id = u.id AND i.is_active = 1
          WHERE u.id = ?",
        [$user['id']]
    );
    $stats = $stmt->fetch();
    
    Response::success([
        'total_clients' => (int)($stats['total_clients'] ?? 0),
        'today_appointments' => (int)($stats['today_appointments'] ?? 0),
        'monthly_revenue' => number_format((float)($stats['monthly_revenue'] ?? 0), 2, '.', ''),
        'low_stock_items' => (int)($stats['low_stock_items'] ?? 0),
        'total_transactions' => (int)($stats['total_transactions'] ?? 0)
    ], 'Dashboard stats retrieved');
    
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}




