<?php
namespace Core;

class Router {
    private $routes = [];
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function get($path, $callback) {
        $this->routes['GET'][$path] = $callback;
    }
    
    public function post($path, $callback) {
        $this->routes['POST'][$path] = $callback;
    }
    
    public function put($path, $callback) {
        $this->routes['PUT'][$path] = $callback;
    }
    
    public function delete($path, $callback) {
        $this->routes['DELETE'][$path] = $callback;
    }
    
    public function dispatch() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        $path = rtrim($path, '/');
        if (empty($path)) {
            $path = '/';
        }
        
        if (isset($this->routes[$method][$path])) {
            $callback = $this->routes[$method][$path];
            return call_user_func($callback);
        }
        
        Response::notFound('Route not found: ' . $method . ' ' . $path);
    }
    
    private function matchRoute($routePattern, $path) {
        $routePattern = preg_quote($routePattern, '#');
        $routePattern = str_replace('\:param', '([^/]+)', $routePattern);
        $routePattern = "#^$routePattern$#";
        
        if (preg_match($routePattern, $path, $matches)) {
            return array_slice($matches, 1);
        }
        
        return false;
    }
}
