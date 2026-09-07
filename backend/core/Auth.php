<?php
namespace Core;

use Core\Database;
use PDO;

class Auth {
    private static $instance = null;
    private $db;
    private $sessionName = 'ink_master_session';
    
    private function __construct() {
        $this->db = Database::getInstance();
        $this->initSession();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function initSession() {
        if (session_status() === PHP_SESSION_NONE) {
            session_set_cookie_params([
                'lifetime' => 3600,
                'path' => '/',
                'domain' => '',
                'secure' => isset($_SERVER['HTTPS']),
                'httponly' => true,
                'samesite' => 'Lax'
            ]);
            session_name($this->sessionName);
            session_start();
        }
    }
    
    public function login($email, $password) {
        $this->checkRateLimit($email);
        
        $stmt = $this->db->query(
            "SELECT id, email, password_hash, full_name, is_active FROM users WHERE email = ?",
            [$email]
        );
        $user = $stmt->fetch();
        
        if (!$user || !$user['is_active']) {
            $this->logFailedAttempt($email);
            return ['success' => false, 'message' => 'Invalid credentials'];
        }
        
        if (!password_verify($password, $user['password_hash'])) {
            $this->logFailedAttempt($email);
            return ['success' => false, 'message' => 'Invalid credentials'];
        }
        
        session_regenerate_id(true);
        
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_name'] = $user['full_name'];
        $_SESSION['logged_in'] = true;
        $_SESSION['ip_address'] = $_SERVER['REMOTE_ADDR'];
        $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        $this->db->query(
            "UPDATE users SET last_login = NOW() WHERE id = ?",
            [$user['id']]
        );
        
        $this->clearFailedAttempts($email);
        
        return ['success' => true, 'message' => 'Login successful'];
    }
    
    public function logout() {
        $_SESSION = [];
        session_destroy();
        return ['success' => true, 'message' => 'Logged out'];
    }
    
    public function isAuthenticated() {
        if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
            return false;
        }
        
        if ($_SESSION['ip_address'] !== $_SERVER['REMOTE_ADDR']) {
            return false;
        }
        
        $stmt = $this->db->query(
            "SELECT id FROM users WHERE id = ? AND is_active = 1",
            [$_SESSION['user_id']]
        );
        $user = $stmt->fetch();
        
        return $user !== false;
    }
    
    public function getCurrentUser() {
        if (!$this->isAuthenticated()) {
            return null;
        }
        
        $stmt = $this->db->query(
            "SELECT id, email, full_name FROM users WHERE id = ?",
            [$_SESSION['user_id']]
        );
        return $stmt->fetch();
    }
    
    private function checkRateLimit($email) {
        $stmt = $this->db->query(
            "SELECT COUNT(*) as attempts FROM login_attempts WHERE email = ? AND attempt_time > DATE_SUB(NOW(), INTERVAL 15 MINUTE)",
            [$email]
        );
        $result = $stmt->fetch();
        
        if ($result['attempts'] >= 5) {
            throw new \Exception('Too many login attempts. Please wait 15 minutes.');
        }
    }
    
    private function logFailedAttempt($email) {
        $this->db->query(
            "INSERT INTO login_attempts (email, ip_address, attempt_time) VALUES (?, ?, NOW())",
            [$email, $_SERVER['REMOTE_ADDR']]
        );
    }
    
    private function clearFailedAttempts($email) {
        $this->db->query(
            "DELETE FROM login_attempts WHERE email = ?",
            [$email]
        );
    }
}
