<?php
namespace Core;

class Validator {
    private $errors = [];
    private $data = [];
    
    public function validate($data, $rules) {
        $this->errors = [];
        $this->data = $data;
        
        foreach ($rules as $field => $rules) {
            foreach ($rules as $rule) {
                $this->applyRule($field, $rule, $data[$field] ?? null);
            }
        }
        
        return empty($this->errors);
    }
    
    private function applyRule($field, $rule, $value) {
        $fieldName = ucfirst(str_replace('_', ' ', $field));
        
        if (strpos($rule, ':') !== false) {
            [$rule, $param] = explode(':', $rule);
        } else {
            $param = null;
        }
        
        switch ($rule) {
            case 'required':
                if ($value === null || trim($value) === '') {
                    $this->addError($field, "{$fieldName} is required");
                }
                break;
            case 'email':
                if ($value && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $this->addError($field, "{$fieldName} must be a valid email address");
                }
                break;
            case 'min':
                if ($value && strlen($value) < (int)$param) {
                    $this->addError($field, "{$fieldName} must be at least {$param} characters");
                }
                break;
            case 'max':
                if ($value && strlen($value) > (int)$param) {
                    $this->addError($field, "{$fieldName} must not exceed {$param} characters");
                }
                break;
            case 'alpha_dash':
                if ($value && !preg_match('/^[a-zA-Z0-9_-]+$/', $value)) {
                    $this->addError($field, "{$fieldName} may only contain letters, numbers, dashes, and underscores");
                }
                break;
            case 'in':
                $allowed = explode(',', $param);
                if ($value && !in_array($value, $allowed)) {
                    $this->addError($field, "{$fieldName} must be one of: " . implode(', ', $allowed));
                }
                break;
        }
    }
    
    private function addError($field, $message) {
        if (!isset($this->errors[$field])) {
            $this->errors[$field] = [];
        }
        $this->errors[$field][] = $message;
    }
    
    public function errors() {
        $flat = [];
        foreach ($this->errors as $field => $messages) {
            foreach ($messages as $message) {
                $flat[$field] = $message;
            }
        }
        return $flat;
    }
}
