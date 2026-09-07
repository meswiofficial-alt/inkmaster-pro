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
        Response::error('Client ID is required', 400);
    }
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $stmt = $db->query(
                "SELECT c.id, c.full_name, c.email, c.phone, c.address, c.tattoo_preferences, 
                        c.allergies_medical_notes, c.avatar_url, c.is_active, c.created_at
                 FROM clients c WHERE c.id = ? AND c.user_id = ?",
                [$id, $user['id']]
            );
            $client = $stmt->fetch();
            
            if (!$client) {
                Response::notFound('Client not found');
            }
            
            Response::success($client, 'Client retrieved');
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $db->query(
                "UPDATE clients SET full_name = ?, phone = ?, email = ?, 
                 tattoo_preferences = ?, address = ? WHERE id = ? AND user_id = ?",
                [
                    $data['full_name'] ?? '',
                    $data['phone'] ?? '',
                    $data['email'] ?? null,
                    $data['tattoo_preferences'] ?? null,
                    $data['address'] ?? null,
                    $id,
                    $user['id']
                ]
            );
            Response::success(null, 'Client updated successfully');
            break;
            
        case 'DELETE':
            $db->query(
                "UPDATE clients SET is_active = 0 WHERE id = ? AND user_id = ?",
                [$id, $user['id']]
            );
            Response::success(null, 'Client deactivated');
            break;
            
        default:
            Response::error('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}




