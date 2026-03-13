<?php
/**
 * 日志工具类
 * 
 * 提供统一的日志记录功能
 * 
 * @package XianyuManager\Utils
 */

namespace App\Utils;

class Logger
{
    /** @var string 日志目录 */
    private static string $logDir = __DIR__ . '/../../storage/logs';
    
    /** @var array 日志级别 */
    private const LEVELS = [
        'DEBUG' => 0,
        'INFO' => 1,
        'WARNING' => 2,
        'ERROR' => 3,
        'CRITICAL' => 4,
    ];
    
    /** @var string 最低日志级别 */
    private static string $minLevel = 'DEBUG';

    /**
     * 设置最低日志级别
     */
    public static function setMinLevel(string $level): void
    {
        self::$minLevel = strtoupper($level);
    }

    /**
     * 记录调试日志
     */
    public static function debug(string $message, array $context = []): void
    {
        self::log('DEBUG', $message, $context);
    }

    /**
     * 记录信息日志
     */
    public static function info(string $message, array $context = []): void
    {
        self::log('INFO', $message, $context);
    }

    /**
     * 记录警告日志
     */
    public static function warning(string $message, array $context = []): void
    {
        self::log('WARNING', $message, $context);
    }

    /**
     * 记录错误日志
     */
    public static function error(string $message, array $context = []): void
    {
        self::log('ERROR', $message, $context);
    }

    /**
     * 记录严重错误日志
     */
    public static function critical(string $message, array $context = []): void
    {
        self::log('CRITICAL', $message, $context);
    }

    /**
     * 记录异常
     */
    public static function exception(\Throwable $e, array $context = []): void
    {
        $context['exception'] = [
            'class' => get_class($e),
            'message' => $e->getMessage(),
            'code' => $e->getCode(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
        ];
        self::error($e->getMessage(), $context);
    }

    /**
     * 记录API请求
     */
    public static function request(string $method, string $uri, array $params = [], ?int $userId = null): void
    {
        self::info("API Request: {$method} {$uri}", [
            'method' => $method,
            'uri' => $uri,
            'params' => $params,
            'user_id' => $userId,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        ]);
    }

    /**
     * 记录API响应
     */
    public static function response(int $statusCode, float $duration, ?string $error = null): void
    {
        $level = $statusCode >= 500 ? 'ERROR' : ($statusCode >= 400 ? 'WARNING' : 'INFO');
        self::log($level, "API Response: {$statusCode}", [
            'status_code' => $statusCode,
            'duration_ms' => round($duration * 1000, 2),
            'error' => $error,
        ]);
    }

    /**
     * 记录数据库查询
     */
    public static function query(string $sql, array $params = [], float $duration = 0): void
    {
        self::debug("SQL Query", [
            'sql' => $sql,
            'params' => $params,
            'duration_ms' => round($duration * 1000, 2),
        ]);
    }

    /**
     * 核心日志方法
     */
    private static function log(string $level, string $message, array $context = []): void
    {
        if (self::LEVELS[$level] < self::LEVELS[self::$minLevel]) {
            return;
        }

        $timestamp = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? ' ' . json_encode($context, JSON_UNESCAPED_UNICODE) : '';
        $logLine = "[{$timestamp}] [{$level}] {$message}{$contextStr}" . PHP_EOL;

        $logFile = self::$logDir . '/' . date('Y-m-d') . '.log';
        
        if (!is_dir(self::$logDir)) {
            mkdir(self::$logDir, 0755, true);
        }

        file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
    }
}
