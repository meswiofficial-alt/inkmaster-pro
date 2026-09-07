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
    $category = $_GET['category'] ?? 'all';
    
    $where = '';
    $params = [$user['id']];
    
    if ($search) {
        $where .= " AND (product_name LIKE ? OR sku LIKE ?)";
        $params = array_merge($params, ["%$search%", "%$search%"]);
    }
    
    if ($category !== 'all') {
        $where .= " AND category = ?";
        $params[] = $category;
    }
    
    $stmt = $db->query(
        "SELECT id, product_name, sku, category, quantity_on_hand, reorder_level, unit_cost, supplier, location
         FROM inventory_items 
         WHERE user_id = ? AND is_active = 1{$where}
         ORDER BY product_name ASC
         LIMIT 100",
        $params
    );
    $items = $stmt->fetchAll();
    
    foreach ($items as &$item) {
        $item['unit_cost'] = (float)$item['unit_cost'];
        $item['quantity_on_hand'] = (int)$item['quantity_on_hand'];
        $item['reorder_level'] = (int)$item['reorder_level'];
        $item['is_low_stock'] = $item['quantity_on_hand'] <= $item['reorder_level'];
    }
    
    Response::success($items, 'Inventory retrieved');
    
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}




