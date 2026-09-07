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
                "SELECT theme_name, primary_color, secondary_color, accent_color, background_url 
                 FROM theme_settings WHERE user_id = ?",
                [$user['id']]
            );
            $theme = $stmt->fetch();
            
            if (!$theme) {
                Response::success([
                    'theme' => 'dark',
                    'primary_color' => '#8B5CF6',
                    'secondary_color' => '#6D28D9',
                    'accent_color' => '#EC4899'
                ], 'Default theme settings');
            }
            
            Response::success($theme, 'Theme settings retrieved');
            break;
            
        case 'POST':
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $theme = $data['theme'] ?? 'dark';
            $primary = $data['primary_color'] ?? '#8B5CF6';
            $secondary = $data['secondary_color'] ?? '#6D28D9';
            $accent = $data['accent_color'] ?? '#EC4899';
            
            if (!preg_match('/^#[0-9a-f]{6}$/i', $primary) || 
                !preg_match('/^#[0-9a-f]{6}$/i', $secondary) || 
                !preg_match('/^#[0-9a-f]{6}$/i', $accent)) {
                Response::error('Invalid color format. Use hex colors (e.g., #8B5CF6)');
            }
            
            $db->query(
                "INSERT INTO theme_settings (user_id, theme_name, primary_color, secondary_color, accent_color) 
                 VALUES (?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                 theme_name = VALUES(theme_name), 
                 primary_color = VALUES(primary_color), 
                 secondary_color = VALUES(secondary_color), 
                 accent_color = VALUES(accent_color)",
                [$user['id'], $theme, $primary, $secondary, $accent]
            );
            
            $db->query(
                "UPDATE users SET theme_preference = ? WHERE id = ?",
                [$theme, $user['id']]
            );
            
            Response::success(null, 'Theme settings updated successfully');
            break;
            
        default:
            Response::error('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    error_log($e->getMessage());
    Response::error('An error occurred: ' . $e->getMessage(), 500);
}




