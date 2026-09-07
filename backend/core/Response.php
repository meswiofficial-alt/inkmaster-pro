<?php
namespace Core;

class Response {
    public static function json($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            exit(0);
        }
        
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    public static function success($data = null, $message = 'Success', $statusCode = 200) {
        return self::json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ], $statusCode);
    }
    
    public static function error($message, $statusCode = 400, $errors = null) {
        return self::json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
            'timestamp' => date('Y-m-d H:i:s')
        ], $statusCode);
    }
    
    public static function unauthorized($message = 'Unauthorized') {
        return self::error($message, 401);
    }
    
    public static function forbidden($message = 'Forbidden') {
        return self::error($message, 403);
    }
    
    public static function notFound($message = 'Resource not found') {
        return self::error($message, 404);
    }
    
    public static function validationError($errors, $message = 'Validation failed') {
        return self::error($message, 422, $errors);
    }
}
