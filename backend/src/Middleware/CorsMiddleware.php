<?php
/**
 * CORS中间件
 * 
 * 处理跨域请求
 * 
 * @package XianyuManager\Middleware
 */

namespace App\Middleware;

class CorsMiddleware
{
    /**
     * 处理CORS
     * 
     * @return void
     */
    public static function handle(): void
    {
        $config = require __DIR__ . '/../../config/app.php';
        $corsConfig = $config['cors'];

        // 设置CORS头
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: ' . implode(', ', $corsConfig['allowed_methods']));
        header('Access-Control-Allow-Headers: ' . implode(', ', $corsConfig['allowed_headers']));
        header('Access-Control-Max-Age: ' . $corsConfig['max_age']);

        // 处理预检请求
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
