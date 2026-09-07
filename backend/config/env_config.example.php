<?php
/**
 * InkMaster Pro - Environment Configuration Template (for production)
 * -----------------------------------------------------------------------------
 * This is the template for production deployments on InfinityFree.
 * Copy this to backend/config/env_config.php and fill in your credentials:
 *   cp backend/config/env_config.example.php backend/config/env_config.php
 *
 * NEVER commit the real env_config.php — it contains production credentials.
 * Add backend/config/env_config.php to your .gitignore (already done).
 * -----------------------------------------------------------------------------
 */

return [
    'APP_ENV'       => 'production',
    'DB_HOST'       => 'sql206.infinityfree.com',  // Your InfinityFree MySQL hostname
    'DB_PORT'       => 3306,
    'DB_NAME'       => 'if0_42744737_XXX',         // ← Replace XXX with your DB suffix
    'DB_USER'       => 'if0_42744737',             // ← Your InfinityFree MySQL username
    'DB_PASSWORD'   => '************',             // ← Replace with your MySQL password
    'DB_CHARSET'    => 'utf8mb4',
    'DB_PREFIX'     => '',
];
