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
    
    $search = $_GET['search'] ?? '';
    $status = $_GET['status'] ?? 'all';
    $client_id = $_GET['client_id'] ?? null;
    
    $where = '';
    $params = [$user['id']];
    
    if ($client_id) {
        $where .= " AND a.client_id = ?";
        $params[] = $client_id;
    }
    if ($status !== 'all') {
        $where .= " AND a.status = ?";
        $params[] = $status;
    }
    
    $stmt = $db->query(
        "SELECT a.id, a.client_id, a.appointment_date, a.start_time, a.duration, 
                a.service_type, a.status, a.total_amount, c.full_name as client_name, c.phone
         FROM appointments a
         JOIN clients c ON a.client_id = c.id
         WHERE a.user_id = ?{$where}
         ORDER BY a.appointment_date DESC, a.start_time DESC
         LIMIT 200",
        $params
    );
    $appointments = $stmt->fetchAll();
    
    Response::success($appointments, 'Appointments retrieved');
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}




