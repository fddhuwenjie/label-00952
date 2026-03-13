<?php
/**
 * 用户模型
 * 
 * @package XianyuManager\Models
 */

namespace App\Models;

class User extends BaseModel
{
    protected static string $table = 'users';

    /**
     * 根据用户名查找用户
     * 
     * @param string $username 用户名
     * @return array|null
     */
    public static function findByUsername(string $username): ?array
    {
        return self::findBy(['username' => $username]);
    }

    /**
     * 根据API Key查找用户
     * 
     * @param string $apiKey API密钥
     * @return array|null
     */
    public static function findByApiKey(string $apiKey): ?array
    {
        return self::findBy(['api_key' => $apiKey]);
    }

    /**
     * 验证密码
     * 
     * @param string $password 明文密码
     * @param string $hash 密码哈希
     * @return bool
     */
    public static function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    /**
     * 生成密码哈希
     * 
     * @param string $password 明文密码
     * @return string
     */
    public static function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    /**
     * 生成API密钥对
     * 
     * @return array ['api_key' => string, 'api_secret' => string]
     */
    public static function generateApiKeys(): array
    {
        return [
            'api_key' => 'ak_' . bin2hex(random_bytes(16)),
            'api_secret' => 'sk_' . bin2hex(random_bytes(24)),
        ];
    }

    /**
     * 更新最后登录时间
     * 
     * @param int $userId 用户ID
     * @return void
     */
    public static function updateLastLogin(int $userId): void
    {
        self::update($userId, ['last_login_at' => date('Y-m-d H:i:s')]);
    }
}
