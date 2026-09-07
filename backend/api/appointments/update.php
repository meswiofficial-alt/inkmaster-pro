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
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        Response::error('Appointment ID is required', 400);
    }
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        $stmt = $db->query(
            "SELECT a.id, a.client_id, a.appointment_date, a.start_time, a.duration, 
                    a.service_type, a.status, a.total_amount, a.design_notes, c.full_name
             FROM appointments a
             JOIN clients c ON a.client_id = c.id
             WHERE a.id = ? AND a.user_id = ?",
            [$id, $user['id']]
        );
        $appointment = $stmt->fetch();
        
        if (!$appointment) {
            Response::notFound('Appointment not found');
        }
        
        Response::success($appointment, 'Appointment retrieved');
    } elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $set = [];
        $params = [];
        
        if (isset($data['status'])) {
            $set[] = "status = ?";
            $params[] = $data['status'];
        }
        if (isset($data['appointment_date'])) {
            $set[] = "appointment_date = ?";
            $params[] = $data['appointment_date'];
        }
        if (isset($data['start_time'])) {
            $set[] = "start_time = ?";
            $params[] = $data['start_time'];
        }
        if (isset($data['service_type'])) {
            $set[] = "service_type = ?";
            $params[] = $data['service_type'];
        }
        if (isset($data['total_amount'])) {
            $set[] = "total_amount = ?";
            $params[] = $data['total_amount'];
        }
        if (isset($data['design_notes'])) {
            $set[] = "design_notes = ?";
            $params[] = $data['design_notes'];
        }
        
        if (empty($set)) {
            Response::error('No fields to update', 400);
        }
        
        $params[] = $id;
        $params[] = $user['id'];
        
        $db->query(
            "UPDATE appointments SET " . implode(', ', $set) . " WHERE id = ? AND user_id = ?",
            $params
        );
        
        Response::success(null, 'Appointment updated successfully');
    } elseif ($method === 'DELETE') {
        $db->query(
            "UPDATE appointments SET status = 'cancelled' WHERE id = ? AND user_id = ?",
            [$id, $user['id']]
        );
        Response::success(null, 'Appointment cancelled');
    }
    
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}




