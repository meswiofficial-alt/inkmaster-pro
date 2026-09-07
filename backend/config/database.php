<?php
/**
 * InkMaster Pro - Database Configuration
 * 
 * Database constants are already defined in config.php.
 * This file provides the DSN builder and connection helper.
 */

// Ensure config.php is loaded (it defines DB_* constants)
if (!defined('DB_HOST')) {
    require_once __DIR__ . '/config.php';
}

// DB_* constants are already defined by config.php
// Database.php can be used for additional database setup if needed
