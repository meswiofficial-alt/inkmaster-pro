<?php
/**
 * InkMaster Pro - Application Configuration
 * 
 * Reads environment variables from Apache SetEnv directives (set in .htaccess)
 * or from env_config.php (for local development where .htaccess SetEnv
 * is not available). Falls back to defaults if neither is available.
 * 
 * @see .env.example for available environment variables
 */

if (!function_exists('getEnvValue')) {
    /**
     * Get an environment variable from $_ENV, $_SERVER, or getenv()
     * @param string $key The env key
     * @param mixed $default Default value if not found
     * @return string
     */
    function getEnvValue($key, $default = null) {
        if (isset($_ENV[$key]) && $_ENV[$key] !== '') return $_ENV[$key];
        if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') return $_SERVER[$key];
        if (getenv($key) !== false) return getenv($key);
        return $default;
    }
}

// Try loading from env_config.php (local development fallback)
$envFile = __DIR__ . '/env_config.php';
if (file_exists($envFile) && !defined('ENV_LOADED')) {
    $envConfig = require $envFile;
    foreach ((array)$envConfig as $key => $value) {
        if (!getEnvValue($key) || getEnvValue($key) === '') {
            $_ENV[$key] = (string)$value;
            $_SERVER[$key] = (string)$value;
            putenv("$key=" . (string)$value);
        }
    }
    define('ENV_LOADED', true);
}

// Application configuration
define('APP_ENV', getEnvValue('APP_ENV', 'production'));
define('APP_DEBUG', APP_ENV === 'development');

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
