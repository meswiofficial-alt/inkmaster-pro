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
    $auth = Auth::getInstance();
    if (!$auth->isAuthenticated()) {
        Response::unauthorized();
    }
    
    $user = $auth->getCurrentUser();
    $db = Database::getInstance();
    $data = json_decode(file_get_contents('php://input'), true);
    
    $db->beginTransaction();
    
    $db->query(
        "INSERT INTO appointments (user_id, client_id, appointment_date, start_time, duration, 
         service_type, status, total_amount, design_notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            $user['id'],
            $data['client_id'] ?? null,
            $data['appointment_date'] ?? date('Y-m-d'),
            $data['start_time'] ?? '09:00:00',
            $data['duration'] ?? 60,
            $data['service_type'] ?? 'new_tattoo',
            $data['status'] ?? 'scheduled',
            $data['total_amount'] ?? 0.00,
            $data['design_notes'] ?? null
        ]
    );
    
    $appointmentId = $db->lastInsertId();
    
    // Create a transaction if total_amount is provided and > 0
    if (isset($data['total_amount']) && (float)$data['total_amount'] > 0) {
        $db->query(
            "INSERT INTO transactions (user_id, transaction_type, category, amount, transaction_date, client_id, appointment_id, payment_method, description) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $user['id'],
                'income',
                'tattoo_session',
                $data['total_amount'],
                $data['appointment_date'] ?? date('Y-m-d'),
                $data['client_id'] ?? null,
                $appointmentId,
                $data['payment_method'] ?? 'cash',
                $data['design_notes'] ?? null
            ]
        );
    }
    
    $db->commit();
    Response::success(['id' => $appointmentId], 'Appointment created successfully', 201);
    
} catch (Exception $e) {
    if (isset($db)) $db->rollBack();
    Response::error($e->getMessage(), 500);
}




