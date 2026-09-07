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
header('Access-Control-Allow-Methods: GET, PUT, DELETE, OPTIONS');
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
        Response::error('Item ID is required', 400);
    }
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        $stmt = $db->query(
            "SELECT id, product_name, sku, category, quantity_on_hand, reorder_level, unit_cost, supplier, location, notes
             FROM inventory_items WHERE id = ? AND user_id = ?",
            [$id, $user['id']]
        );
        $item = $stmt->fetch();
        
        if (!$item) {
            Response::notFound('Item not found');
        }
        
        Response::success($item, 'Inventory item retrieved');
    } elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $set = [];
        $params = [];
        
        if (isset($data['product_name'])) {
            $set[] = "product_name = ?";
            $params[] = $data['product_name'];
        }
        if (isset($data['quantity_on_hand'])) {
            $set[] = "quantity_on_hand = ?";
            $params[] = (int)$data['quantity_on_hand'];
        }
        if (isset($data['reorder_level'])) {
            $set[] = "reorder_level = ?";
            $params[] = (int)$data['reorder_level'];
        }
        if (isset($data['unit_cost'])) {
            $set[] = "unit_cost = ?";
            $params[] = (float)$data['unit_cost'];
        }
        if (isset($data['supplier'])) {
            $set[] = "supplier = ?";
            $params[] = $data['supplier'];
        }
        if (isset($data['location'])) {
            $set[] = "location = ?";
            $params[] = $data['location'];
        }
        if (isset($data['is_active'])) {
            $set[] = "is_active = ?";
            $params[] = (int)$data['is_active'];
        }
        
        if (empty($set)) {
            Response::error('No fields to update', 400);
        }
        
        $params[] = $id;
        $params[] = $user['id'];
        
        $db->query(
            "UPDATE inventory_items SET " . implode(', ', $set) . " WHERE id = ? AND user_id = ?",
            $params
        );
        
        Response::success(null, 'Inventory item updated');
    } elseif ($method === 'DELETE') {
        $db->query(
            "UPDATE inventory_items SET is_active = 0 WHERE id = ? AND user_id = ?",
            [$id, $user['id']]
        );
        Response::success(null, 'Inventory item deactivated');
    }
    
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}




