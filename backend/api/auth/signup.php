<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
require_once __DIR__ . '/../../bootstrap.php';
use Core\Database;
use Core\Validator;
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
    $data = json_decode(file_get_contents('php://input'), true);
    $db = Database::getInstance();
    
    $validator = new Validator();
    $rules = [
        'username' => ['required', 'min:3', 'max:50', 'alpha_dash'],
        'email' => ['required', 'email', 'max:255'],
        'password' => ['required', 'min:8', 'max:100'],
        'full_name' => ['required', 'max:100'],
        'role' => ['in:artist,staff']
    ];
    
    if (!$validator->validate($data, $rules)) {
        Response::validationError($validator->errors());
    }
    
    $stmt = $db->query("SELECT setting_value FROM system_settings WHERE setting_key = 'allow_signup'");
    $setting = $stmt->fetch();
    
    if ($setting && $setting['setting_value'] !== 'true') {
        Response::error('Registration is currently disabled', 403);
    }
    
    $stmt = $db->query("SELECT id FROM users WHERE username = ?", [$data['username']]);
    if ($stmt->fetch()) {
        Response::validationError(['username' => 'Username already taken']);
    }
    
    $stmt = $db->query("SELECT id FROM users WHERE email = ?", [$data['email']]);
    if ($stmt->fetch()) {
        Response::validationError(['email' => 'Email already registered']);
    }
    
    $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]);
    $verificationToken = bin2hex(random_bytes(32));
    
    $db->beginTransaction();
    
    $db->query(
        "INSERT INTO users (username, email, password_hash, full_name, role, verification_token) 
         VALUES (?, ?, ?, ?, ?, ?)",
        [
            $data['username'],
            $data['email'],
            $passwordHash,
            $data['full_name'],
            $data['role'] ?? 'artist',
            $verificationToken
        ]
    );
    
    $userId = $db->lastInsertId();
    
    $db->query(
        "INSERT INTO theme_settings (user_id, theme_name, primary_color, secondary_color, accent_color) 
         VALUES (?, 'dark', '#8B5CF6', '#6D28D9', '#EC4899')",
        [$userId]
    );
    
    $db->commit();
    
    Response::success([
        'user_id' => $userId,
        'username' => $data['username'],
        'email' => $data['email']
    ], 'Account created successfully! Please verify your email.', 201);
    
} catch (Exception $e) {
    if (isset($db)) $db->rollback();
    Response::error('Registration failed: ' . $e->getMessage(), 500);
}

