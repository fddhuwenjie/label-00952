<?php
/**
 * 系统配置模型
 * 
 * @package XianyuManager\Models
 */

namespace App\Models;

use App\Utils\Database;

class SystemConfig extends BaseModel
{
    protected static string $table = 'system_configs';

    /** @var array 配置缓存 */
    private static array $cache = [];

    /**
     * 获取配置值
     * 
     * @param string $key 配置键
     * @param mixed $default 默认值
     * @return mixed
     */
    public static function get(string $key, $default = null)
    {
        if (isset(self::$cache[$key])) {
            return self::$cache[$key];
        }

        $config = self::findBy(['key' => $key]);
        $value = $config ? $config['value'] : $default;
        
        self::$cache[$key] = $value;
        return $value;
    }

    /**
     * 设置配置值
     * 
     * @param string $key 配置键
     * @param mixed $value 配置值
     * @param string|null $description 描述
     * @return void
     */
    public static function set(string $key, $value, ?string $description = null): void
    {
        $existing = self::findBy(['key' => $key]);

        if ($existing) {
            self::update($existing['id'], ['value' => $value]);
        } else {
            self::create([
                'key' => $key,
                'value' => $value,
                'description' => $description,
            ]);
        }

        self::$cache[$key] = $value;
    }

    /**
     * 批量获取配置
     * 
     * @param array $keys 配置键数组
     * @return array
     */
    public static function getMultiple(array $keys): array
    {
        $placeholders = implode(',', array_fill(0, count($keys), '?'));
        $sql = "SELECT `key`, `value` FROM system_configs WHERE `key` IN ({$placeholders})";
        $results = Database::fetchAll($sql, $keys);

        $config = [];
        foreach ($results as $row) {
            $config[$row['key']] = $row['value'];
            self::$cache[$row['key']] = $row['value'];
        }

        return $config;
    }

    /**
     * 批量设置配置
     * 
     * @param array $configs 配置数组 ['key' => 'value', ...]
     * @return void
     */
    public static function setMultiple(array $configs): void
    {
        foreach ($configs as $key => $value) {
            self::set($key, $value);
        }
    }

    /**
     * 获取所有配置
     * 
     * @return array
     */
    public static function getAllConfigs(): array
    {
        $sql = "SELECT * FROM system_configs ORDER BY id ASC";
        return Database::fetchAll($sql);
    }
}
