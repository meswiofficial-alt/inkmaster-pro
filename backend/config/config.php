<?php
/**
 * InkMaster Pro - Application Configuration
 * 
 * Reads environment variables in this order:
 * 1. Apache SetEnv (from .htaccess) — via getenv() / $_SERVER
 * 2. env_config.php (fallback) — direct PHP file
 * 
 * This works reliably on InfinityFree without depending on
 * a single source.
 */

// Helper to read env vars from multiple sources
if (!function_exists('getEnvValue')) {
    function getEnvValue($key, $default = null) {
        if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') return $_SERVER[$key];
        if (isset($_ENV[$key]) && $_ENV[$key] !== '') return $_ENV[$key];
        if (getenv($key) !== false) return getenv($key);
        return $default;
    }
}

// Try SetEnv first (from backend/.htaccess)
$env = [];
$env['APP_ENV']     = getEnvValue('APP_ENV');
$env['DB_HOST']     = getEnvValue('DB_HOST');
$env['DB_PORT']     = getEnvValue('DB_PORT');
$env['DB_NAME']     = getEnvValue('DB_NAME');
$env['DB_USER']     = getEnvValue('DB_USER');
$env['DB_PASSWORD'] = getEnvValue('DB_PASSWORD');
$env['DB_CHARSET']  = getEnvValue('DB_CHARSET');
$env['DB_PREFIX']   = getEnvValue('DB_PREFIX');

// Fallback to env_config.php if SetEnv didn't provide values
if (empty($env['DB_HOST']) || empty($env['DB_NAME'])) {
    $file = __DIR__ . '/env_config.php';
    if (file_exists($file)) {
        $fallback = require $file;
        foreach ((array)$fallback as $k => $v) {
            if (empty($env[$k])) {
                $env[$k] = $v;
            }
        }
    }
}

// Define constants
define('APP_ENV', $env['APP_ENV'] ?? 'production');
define('APP_DEBUG', APP_ENV === 'development');

define('DB_HOST', $env['DB_HOST'] ?? 'localhost');
define('DB_PORT', (int)($env['DB_PORT'] ?? 3306));
define('DB_NAME', $env['DB_NAME'] ?? 'ink_master_pro');
define('DB_USER', $env['DB_USER'] ?? 'root');
define('DB_PASSWORD', $env['DB_PASSWORD'] ?? '');
define('DB_CHARSET', $env['DB_CHARSET'] ?? 'utf8mb4');
define('DB_PREFIX', $env['DB_PREFIX'] ?? '');

// Session configuration
define('SESSION_LIFETIME', 3600);
define('SESSION_NAME', 'ink_master_session');

// Application paths
define('BASE_PATH', dirname(__DIR__, 2));
define('BACKEND_PATH', BASE_PATH . '/backend');
define('FRONTEND_PATH', BASE_PATH . '/frontend');

// Error reporting
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    @ini_set('error_log', BACKEND_PATH . '/logs/app.log');
}
