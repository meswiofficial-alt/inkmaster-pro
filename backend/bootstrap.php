<?php
/**
 * InkMaster Pro - Application Bootstrap
 * 
 * Loads configuration and core classes. Include this file in all
 * API endpoints instead of requiring individual files.
 */

// Load environment and application configuration
require_once __DIR__ . '/config/database.php';

// Load core classes
require_once __DIR__ . '/core/ErrorHandler.php';
require_once __DIR__ . '/core/Database.php';
require_once __DIR__ . '/core/Auth.php';
require_once __DIR__ . '/core/Response.php';
require_once __DIR__ . '/core/Router.php';
require_once __DIR__ . '/core/Validator.php';

// Register error handler
\Core\ErrorHandler::register();
