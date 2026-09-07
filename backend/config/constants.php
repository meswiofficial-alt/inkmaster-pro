<?php
// Application constants

// Date/Time formats
define('DATE_FORMAT', 'Y-m-d');
define('TIME_FORMAT', 'H:i');
define('DATETIME_FORMAT', 'Y-m-d H:i:s');

// Pagination
define('DEFAULT_PAGE_SIZE', 20);
define('MAX_PAGE_SIZE', 100);

// File upload
define('MAX_UPLOAD_SIZE', 5 * 1024 * 1024); // 5MB
define('UPLOAD_DIR', BASE_PATH . '/frontend/assets/images/uploads');
define('ALLOWED_IMAGE_TYPES', ['jpg', 'jpeg', 'png', 'gif']);

// Currency
define('DEFAULT_CURRENCY', 'KSH');
define('CURRENCY_SYMBOL', 'KSh');

// Roles
define('ROLE_ADMIN', 'admin');
define('ROLE_ARTIST', 'artist');
define('ROLE_STAFF', 'staff');

// Appointment statuses
define('APPT_SCHEDULED', 'scheduled');
define('APPT_IN_PROGRESS', 'in_progress');
define('APPT_COMPLETED', 'completed');
define('APPT_CANCELLED', 'cancelled');
define('APPT_NO_SHOW', 'no_show');

// Service types
define('SERVICE_NEW_TATTOO', 'new_tattoo');
define('SERVICE_TOUCH_UP', 'touch_up');
define('SERVICE_CONSULTATION', 'consultation');
define('SERVICE_COVER_UP', 'cover_up');
define('SERVICE_CUSTOM_DESIGN', 'custom_design');

// Transaction types
define('TXN_INCOME', 'income');
define('TXN_EXPENSE', 'expense');

// Inventory categories
define('INV_INK_PIGMENTS', 'ink_pigments');
define('INV_NEEDLES_TUBES', 'needles_tubes');
define('INV_SANITATION_SAFETY', 'sanitation_safety');
define('INV_OFFICE_SUPPLIES', 'office_supplies');
define('INV_MERCHANDISE', 'merchandise');

// Rate limiting
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_TIME', 900); // 15 minutes in seconds

// API version
define('API_VERSION', 'v1');
