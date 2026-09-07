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
    
    $stmt = $db->query(
        "SELECT id, product_name, quantity_on_hand, reorder_level, category
         FROM inventory_items 
         WHERE user_id = ? AND is_active = 1 AND quantity_on_hand <= reorder_level
         ORDER BY quantity_on_hand ASC",
        [$user['id']]
    );
    $alerts = $stmt->fetchAll();
    
    Response::success($alerts, 'Low stock alerts retrieved');
    
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}




