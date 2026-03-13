<?php
/**
 * JWT工具类
 * 
 * 提供JWT令牌的生成和验证
 * 
 * @package XianyuManager\Utils
 */

namespace App\Utils;

class JWT
{
    /** @var string 密钥 */
    private static string $secret;

    /**
     * 初始化密钥
     * 
     * @return void
     */
    private static function init(): void
    {
        if (!isset(self::$secret)) {
            $config = require __DIR__ . '/../../config/app.php';
            self::$secret = $config['jwt_secret'];
        }
    }

    /**
     * 生成JWT令牌
     * 
     * @param array $payload 载荷数据
     * @param int $expire 过期时间(秒)
     * @return string
     */
    public static function encode(array $payload, int $expire = 604800): string
    {
        self::init();

        $header = self::base64UrlEncode(json_encode([
            'typ' => 'JWT',
            'alg' => 'HS256'
        ]));

        $payload['iat'] = time();
        $payload['exp'] = time() + $expire;
        $payload = self::base64UrlEncode(json_encode($payload));

        $signature = self::base64UrlEncode(
            hash_hmac('sha256', "{$header}.{$payload}", self::$secret, true)
        );

        return "{$header}.{$payload}.{$signature}";
    }

    /**
     * 解码JWT令牌
     * 
     * @param string $token JWT令牌
     * @return array|null 解码后的载荷,失败返回null
     */
    public static function decode(string $token): ?array
    {
        self::init();

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$header, $payload, $signature] = $parts;

        // 验证签名
        $expectedSignature = self::base64UrlEncode(
            hash_hmac('sha256', "{$header}.{$payload}", self::$secret, true)
        );

        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }

        // 解码载荷
        $payload = json_decode(self::base64UrlDecode($payload), true);
        if (!$payload) {
            return null;
        }

        // 检查过期
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    /**
     * 从请求头获取并验证令牌
     * 
     * @return array|null
     */
    public static function getPayloadFromHeader(): ?array
    {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        
        if (preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
            return self::decode($matches[1]);
        }

        return null;
    }

    /**
     * Base64 URL安全编码
     * 
     * @param string $data 数据
     * @return string
     */
    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL安全解码
     * 
     * @param string $data 数据
     * @return string
     */
    private static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
