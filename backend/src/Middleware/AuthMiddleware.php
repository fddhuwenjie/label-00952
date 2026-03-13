<?php
/**
 * 认证中间件
 * 
 * 验证JWT令牌或API Key
 * 
 * @package XianyuManager\Middleware
 */

namespace App\Middleware;

use App\Utils\JWT;
use App\Utils\Response;
use App\Models\User;

class AuthMiddleware
{
    /**
     * JWT认证
     * 
     * @return array 用户信息
     */
    public static function authenticate(): array
    {
        $payload = JWT::getPayloadFromHeader();
        
        if (!$payload || !isset($payload['user_id'])) {
            Response::unauthorized();
        }

        $user = User::find($payload['user_id']);
        
        if (!$user || $user['status'] != 1) {
            Response::unauthorized('账号已被禁用');
        }

        return $user;
    }

    /**
     * API Key认证
     * 
     * @return array 用户信息
     */
    public static function authenticateApiKey(): array
    {
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
        $timestamp = $_SERVER['HTTP_X_TIMESTAMP'] ?? '';
        $sign = $_SERVER['HTTP_X_API_SIGN'] ?? '';

        if (empty($apiKey)) {
            Response::error('缺少API Key', 401, 401);
        }

        $user = User::findByApiKey($apiKey);
        
        if (!$user) {
            Response::error('无效的API Key', 401, 401);
        }

        if ($user['status'] != 1) {
            Response::error('账号已被禁用', 401, 401);
        }

        // 验证签名(可选,为易语言简化可以跳过)
        if (!empty($sign) && !empty($timestamp)) {
            $expectedSign = md5($apiKey . $user['api_secret'] . $timestamp);
            if ($sign !== $expectedSign) {
                Response::error('签名验证失败', 401, 401);
            }
        }

        return $user;
    }

    /**
     * 检查管理员权限
     * 
     * @param array $user 用户信息
     * @return void
     */
    public static function requireAdmin(array $user): void
    {
        if ($user['role'] !== 'admin') {
            Response::forbidden('需要管理员权限');
        }
    }

    /**
     * 检查操作员及以上权限
     * 
     * @param array $user 用户信息
     * @return void
     */
    public static function requireOperator(array $user): void
    {
        if (!in_array($user['role'], ['admin', 'operator'])) {
            Response::forbidden('需要操作员权限');
        }
    }
}
