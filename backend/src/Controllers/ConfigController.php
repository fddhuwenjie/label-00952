<?php
/**
 * 系统配置控制器
 * 
 * @package XianyuManager\Controllers
 */

namespace App\Controllers;

use App\Models\SystemConfig;
use App\Utils\Response;
use App\Middleware\AuthMiddleware;

class ConfigController
{
    /**
     * 获取所有配置
     * 
     * GET /api/v1/configs
     * 
     * @return void
     */
    public static function index(): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireAdmin($user);

        $configs = SystemConfig::getAllConfigs();
        
        // 转换为键值对格式
        $result = [];
        foreach ($configs as $config) {
            $result[$config['key']] = [
                'value' => $config['value'],
                'description' => $config['description'],
            ];
        }

        Response::success($result);
    }

    /**
     * 获取单个配置
     * 
     * GET /api/v1/configs/{key}
     * 
     * @param string $key 配置键
     * @return void
     */
    public static function show(string $key): void
    {
        AuthMiddleware::authenticate();

        $value = SystemConfig::get($key);
        Response::success(['key' => $key, 'value' => $value]);
    }

    /**
     * 更新配置
     * 
     * PUT /api/v1/configs/{key}
     * 
     * @param string $key 配置键
     * @return void
     */
    public static function update(string $key): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireAdmin($user);

        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        if (!isset($data['value'])) {
            Response::error('配置值不能为空');
        }

        SystemConfig::set($key, $data['value'], $data['description'] ?? null);
        Response::success(null, '配置更新成功');
    }

    /**
     * 批量更新配置
     * 
     * PUT /api/v1/configs
     * 
     * @return void
     */
    public static function batchUpdate(): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireAdmin($user);

        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        if (empty($data) || !is_array($data)) {
            Response::error('请提供配置数据');
        }

        SystemConfig::setMultiple($data);
        Response::success(null, '配置批量更新成功');
    }

    /**
     * 获取公开配置(无需认证)
     * 
     * GET /api/v1/configs/public
     * 
     * @return void
     */
    public static function publicConfigs(): void
    {
        $publicKeys = ['site_name'];
        $configs = SystemConfig::getMultiple($publicKeys);
        Response::success($configs);
    }
}
