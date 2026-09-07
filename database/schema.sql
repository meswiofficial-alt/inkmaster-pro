-- Create database
CREATE DATABASE IF NOT EXISTS ink_master_pro;
USE ink_master_pro;

-- Users table (multi-user support)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    profile_image VARCHAR(255),
    role ENUM('admin', 'artist', 'staff') DEFAULT 'artist',
    theme_preference VARCHAR(20) DEFAULT 'dark',
    notification_preferences JSON,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- Login attempts for rate limiting
CREATE TABLE login_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_ip (email, ip_address),
    INDEX idx_time (attempt_time)
) ENGINE=InnoDB;

-- User sessions (for stateless architecture)
CREATE TABLE user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (session_token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- Theme settings table
CREATE TABLE theme_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    theme_name VARCHAR(50) NOT NULL,
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    accent_color VARCHAR(7),
    background_url VARCHAR(255),
    custom_css TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_theme (user_id)
) ENGINE=InnoDB;

-- Clients table
CREATE TABLE clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    date_of_birth DATE,
    address TEXT,
    tattoo_preferences TEXT,
    allergies_medical_notes TEXT,
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_phone (phone),
    INDEX idx_email (email)
) ENGINE=InnoDB;

-- Client documents/images
CREATE TABLE client_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    document_type ENUM('reference_image', 'design_sketch', 'portfolio', 'consent_form') NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_client (client_id)
) ENGINE=InnoDB;

-- Appointments table
CREATE TABLE appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    user_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration INT NOT NULL COMMENT 'Duration in minutes',
    service_type ENUM('new_tattoo', 'touch_up', 'consultation', 'cover_up', 'custom_design') NOT NULL,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    design_notes TEXT,
    deposit_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_date (appointment_date),
    INDEX idx_client (client_id),
    INDEX idx_status (status),
    CONSTRAINT check_time_slot UNIQUE (appointment_date, start_time)
) ENGINE=InnoDB;

-- Financial transactions
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    transaction_type ENUM('income', 'expense') NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_date DATE NOT NULL,
    client_id INT NULL,
    appointment_id INT NULL,
    payment_method ENUM('cash', 'mpesa', 'bank_transfer', 'credit_card') NULL,
    vendor VARCHAR(100) NULL,
    receipt_url VARCHAR(255) NULL,
    description TEXT,
    is_reconciled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    INDEX idx_date (transaction_date),
    INDEX idx_type (transaction_type),
    INDEX idx_client (client_id)
) ENGINE=InnoDB;

-- Inventory items
CREATE TABLE inventory_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    category ENUM('ink_pigments', 'needles_tubes', 'sanitation_safety', 'office_supplies', 'merchandise') NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 5,
    unit_cost DECIMAL(10,2) NOT NULL,
    supplier VARCHAR(100),
    location VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_sku (sku),
    INDEX idx_category (category),
    INDEX idx_reorder (quantity_on_hand, reorder_level)
) ENGINE=InnoDB;

-- Inventory adjustments
CREATE TABLE inventory_adjustments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inventory_item_id INT NOT NULL,
    user_id INT NOT NULL,
    adjustment_type ENUM('add', 'remove', 'adjust') NOT NULL,
    quantity INT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_item (inventory_item_id)
) ENGINE=InnoDB;

-- System settings
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insert default admin user (password: Admin@2026)
INSERT INTO users (username, email, password_hash, full_name, role, email_verified) 
VALUES ('admin', 'admin@inkmaster.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Master Artist', 'admin', TRUE);

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('business_name', 'InkMaster Pro Studio', 'Business display name'),
('currency', 'KSH', 'Default currency'),
('tax_rate', '16', 'Tax rate percentage'),
('booking_duration', '60', 'Default appointment duration in minutes'),
('allow_signup', 'true', 'Allow user registration'),
('default_theme', 'dark', 'Default theme for new users');
