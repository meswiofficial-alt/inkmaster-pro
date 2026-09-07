<?php
/**
 * InkMaster Pro - Database Configuration
 * 
 * All database credentials are read from environment variables.
 * Copy .env.example to .env and fill in your actual values.
 * NEVER commit .env to version control.
 * 
 * @see .env.example
 */

// Require the main config loader first
require_once __DIR__ . '/config.php';

// Database connection settings — sourced entirely from environment
define('DB_HOST', getEnvValue('DB_HOST', 'localhost'));
define('DB_NAME', getEnvValue('DB_NAME', 'ink_master_pro'));
define('DB_USER', getEnvValue('DB_USER', 'root'));
define('DB_PASSWORD', getEnvValue('DB_PASSWORD', ''));
define('DB_CHARSET', 'utf8mb4');
define('DB_PORT', (int)getEnvValue('DB_PORT', '3306'));

// Table prefix (optional, useful for shared hosting)
define('DB_PREFIX', getEnvValue('DB_PREFIX', ''));
