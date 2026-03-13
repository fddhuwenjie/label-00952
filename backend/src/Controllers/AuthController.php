<?php
/**
 * 认证控制器
 * 
 * 处理用户登录、注册、信息获取等
 * 
 * @package XianyuManager\Controllers
 */

namespace App\Controllers;

use App\Models\User;
use App\Utils\Response;
use App\Utils\JWT;
use App\Utils\Validator;
use App\Utils\Logger;
use App\Middleware\AuthMiddleware;

class AuthController
{
    /**
     * 用户登录
     * 
     * POST /api/v1/auth/login
     * 
     * @return void
     */
    public static function login(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        Logger::info("登录尝试", ['username' => $data['username'] ?? 'unknown', 'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown']);

        // 验证
        $validator = Validator::make($data)
            ->required('username', '用户名不能为空')
            ->required('password', '密码不能为空');

        if ($validator->fails()) {
            Logger::warning("登录验证失败", ['error' => $validator->getFirstError()]);
            Response::error($validator->getFirstError());
        }

        // 查找用户
        $user = User::findByUsername($data['username']);
        
        if (!$user || !User::verifyPassword($data['password'], $user['password'])) {
            Logger::warning("登录失败：用户名或密码错误", ['username' => $data['username']]);
            Response::error('用户名或密码错误');
        }

        if ($user['status'] != 1) {
            Logger::warning("登录失败：账号已禁用", ['user_id' => $user['id']]);
            Response::error('账号已被禁用');
        }

        // 更新登录时间
        User::updateLastLogin($user['id']);

        // 生成令牌
        $token = JWT::encode([
            'user_id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
        ]);

        Logger::info("登录成功", ['user_id' => $user['id'], 'username' => $user['username']]);

        Response::success([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'role' => $user['role'],
                'avatar' => $user['avatar'],
            ],
        ], '登录成功');
    }

    /**
     * 获取当前用户信息
     * 
     * GET /api/v1/auth/me
     * 
     * @return void
     */
    public static function me(): void
    {
        $user = AuthMiddleware::authenticate();

        Response::success([
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'role' => $user['role'],
            'avatar' => $user['avatar'],
            'api_key' => $user['api_key'],
            'last_login_at' => $user['last_login_at'],
            'created_at' => $user['created_at'],
        ]);
    }

    /**
     * 修改密码
     * 
     * PUT /api/v1/auth/password
     * 
     * @return void
     */
    public static function changePassword(): void
    {
        $user = AuthMiddleware::authenticate();
        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        Logger::info("修改密码请求", ['user_id' => $user['id']]);

        $validator = Validator::make($data)
            ->required('old_password', '原密码不能为空')
            ->required('new_password', '新密码不能为空')
            ->minLength('new_password', 6, '新密码长度不能小于6位');

        if ($validator->fails()) {
            Response::error($validator->getFirstError());
        }

        if (!User::verifyPassword($data['old_password'], $user['password'])) {
            Logger::warning("修改密码失败：原密码错误", ['user_id' => $user['id']]);
            Response::error('原密码错误');
        }

        User::update($user['id'], [
            'password' => User::hashPassword($data['new_password']),
        ]);

        Logger::info("密码修改成功", ['user_id' => $user['id']]);
        Response::success(null, '密码修改成功');
    }

    /**
     * 刷新API密钥
     * 
     * POST /api/v1/auth/refresh-api-key
     * 
     * @return void
     */
    public static function refreshApiKey(): void
    {
        $user = AuthMiddleware::authenticate();
        
        Logger::info("刷新API密钥", ['user_id' => $user['id']]);
        
        $keys = User::generateApiKeys();
        User::update($user['id'], $keys);

        Response::success($keys, 'API密钥已刷新');
    }

    /**
     * 更新用户信息
     * 
     * PUT /api/v1/auth/profile
     * 
     * @return void
     */
    public static function updateProfile(): void
    {
        $user = AuthMiddleware::authenticate();
        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        $allowedFields = ['email', 'phone', 'avatar'];
        $updateData = [];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }

        if (!empty($updateData)) {
            User::update($user['id'], $updateData);
        }

        Response::success(null, '信息更新成功');
    }
}
