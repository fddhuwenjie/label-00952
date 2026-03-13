<?php
/**
 * 数据库配置文件
 * 
 * @package XianyuManager
 */

return [
    'driver' => 'mysql',
    'host' => getenv('DB_HOST') ?: 'mysql',
    'port' => getenv('DB_PORT') ?: '3306',
    'database' => getenv('DB_DATABASE') ?: 'xianyu_manager',
    'username' => getenv('DB_USERNAME') ?: 'xianyu',
    'password' => getenv('DB_PASSWORD') ?: 'xianyu123',
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
];
