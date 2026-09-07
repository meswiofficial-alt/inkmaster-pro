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
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
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
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Method not allowed', 405);
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $required = ['product_name', 'sku', 'category', 'quantity_on_hand', 'reorder_level', 'unit_cost'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            Response::error("{$field} is required", 422);
        }
    }
    
    $db->query(
        "INSERT INTO inventory_items (user_id, product_name, sku, category, quantity_on_hand, reorder_level, unit_cost, supplier, location, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            $user['id'],
            $data['product_name'],
            $data['sku'],
            $data['category'],
            (int)$data['quantity_on_hand'],
            (int)$data['reorder_level'],
            (float)$data['unit_cost'],
            $data['supplier'] ?? null,
            $data['location'] ?? null,
            $data['notes'] ?? null
        ]
    );
    
    Response::success(['id' => $db->lastInsertId()], 'Inventory item created successfully', 201);
    
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}




