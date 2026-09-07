<?php
/**
 * InkMaster Pro - Secure Database Connection Class
 * 
 * Reads credentials from environment-defined constants — no hardcoded
 * usernames, passwords, or database names in this file.
 * 
 * @see backend/config/database.php for env var setup
 */

namespace Core;

use PDO;
use PDOException;

class Database {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        // Credentials come from environment variables loaded in config/database.php
        $host = DB_HOST;
        $database = DB_NAME;
        $username = DB_USER;
        $password = DB_PASSWORD;
        $port = DB_PORT;
        $charset = DB_CHARSET;
        
        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$database};charset={$charset}";
            $this->connection = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_PERSISTENT => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset}"
            ]);
        } catch (PDOException $e) {
            ErrorHandler::logError('Database connection failed: ' . $e->getMessage());
            throw new \Exception('Database connection error');
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function prepare($sql) {
        return $this->connection->prepare($sql);
    }
    
    public function query($sql, $params = []) {
        $stmt = $this->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
    
    public function lastInsertId() {
        return $this->connection->lastInsertId();
    }
    
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }
    
    public function commit() {
        return $this->connection->commit();
    }
    
    public function rollback() {
        return $this->connection->rollback();
    }
}
