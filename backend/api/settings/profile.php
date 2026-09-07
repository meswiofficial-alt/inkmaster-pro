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
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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
            $stmt = $db->query(
                "SELECT u.username, u.email, u.full_name, u.role, u.profile_image, u.notification_preferences,
                        s.setting_value as business_name, s2.setting_value as currency, s3.setting_value as tax_rate
                 FROM users u
                 LEFT JOIN system_settings s ON s.setting_key = 'business_name'
                 LEFT JOIN system_settings s2 ON s2.setting_key = 'currency'
                 LEFT JOIN system_settings s3 ON s3.setting_key = 'tax_rate'
                 WHERE u.id = ?",
                [$user['id']]
            );
            $profile = $stmt->fetch();
            
            if (!$profile) {
                Response::notFound('User not found');
            }
            
            Response::success([
                'username' => $profile['username'],
                'email' => $profile['email'],
                'full_name' => $profile['full_name'],
                'role' => $profile['role'],
                'profile_image' => $profile['profile_image'],
                'notification_preferences' => json_decode($profile['notification_preferences'], true),
                'business_name' => $profile['business_name'] ?? 'InkMaster Pro Studio'
            ], 'Profile retrieved');
            break;
            
        case 'POST':
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $updates = [];
            $params = [];
            
            if (isset($data['full_name'])) {
                $updates[] = "full_name = ?";
                $params[] = $data['full_name'];
            }
            if (isset($data['username'])) {
                $stmt = $db->query("SELECT id FROM users WHERE username = ? AND id != ?", [$data['username'], $user['id']]);
                if ($stmt->fetch()) {
                    Response::error('Username already taken', 422);
                }
                $updates[] = "username = ?";
                $params[] = $data['username'];
            }
            if (isset($data['notification_preferences'])) {
                $updates[] = "notification_preferences = ?";
                $params[] = json_encode($data['notification_preferences']);
            }
            if (isset($data['current_password']) && isset($data['new_password'])) {
                $stmt = $db->query("SELECT password_hash FROM users WHERE id = ?", [$user['id']]);
                $current = $stmt->fetch();
                
                if (!password_verify($data['current_password'], $current['password_hash'])) {
                    Response::error('Current password is incorrect', 401);
                }
                
                $updates[] = "password_hash = ?";
                $params[] = password_hash($data['new_password'], PASSWORD_BCRYPT, ['cost' => 12]);
            }
            
            if (empty($updates)) {
                Response::error('No fields to update', 400);
            }
            
            $params[] = $user['id'];
            
            $db->query(
                "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?",
                $params
            );
            
            Response::success(null, 'Profile updated successfully');
            break;
            
        default:
            Response::error('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    Response::error('An error occurred: ' . $e->getMessage(), 500);
}




