<?php
/**
 * 应用配置文件
 * 
 * @package XianyuManager
 */

return [
    // 应用名称
    'name' => '闲鱼管理系统',
    
    // 调试模式
    'debug' => getenv('APP_DEBUG') ?: false,
    
    // 时区
    'timezone' => 'Asia/Shanghai',
    
    // JWT密钥
    'jwt_secret' => getenv('JWT_SECRET') ?: 'xianyu_manager_secret_key_2026',
    
    // JWT过期时间(秒)
    'jwt_expire' => 86400 * 7, // 7天
    
    // API版本
    'api_version' => 'v1',
    
    // 跨域配置
    'cors' => [
        'allowed_origins' => ['*'],
        'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Content-Type', 'Authorization', 'X-Api-Key', 'X-Api-Sign', 'X-Timestamp'],
        'max_age' => 86400,
    ],
    
    // 分页配置
    'pagination' => [
        'per_page' => 20,
        'max_per_page' => 100,
    ],
];
