<?php
namespace Core;

class ErrorHandler {
    private static $logFile = __DIR__ . '/../logs/app.log';
    
    public static function handleError($errno, $errstr, $errfile, $errline) {
        self::logError("[$errno] $errstr in $errfile on line $errline");
        
        if (!(error_reporting() & $errno)) {
            return false;
        }
        
        throw new \ErrorException($errstr, 0, $errno, $errfile, $errline);
    }
    
    public static function handleException($exception) {
        self::logError('Exception: ' . $exception->getMessage() . "\n" . $exception->getTraceAsString());
        
        if (class_exists('Core\\Response')) {
            Response::error('An internal server error occurred', 500);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Internal server error']);
        }
    }
    
    public static function logError($message) {
        $logDir = dirname(self::$logFile);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[{$timestamp}] {$message}\n";
        file_put_contents(self::$logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    public static function register() {
        set_error_handler([self::class, 'handleError']);
        set_exception_handler([self::class, 'handleException']);
    }
}
