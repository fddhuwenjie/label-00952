<?php
/**
 * 数据库连接类
 * 
 * 提供PDO数据库连接和基础查询方法
 * 
 * @package XianyuManager\Utils
 */

namespace App\Utils;

use PDO;
use PDOException;

class Database
{
    /** @var PDO|null 数据库连接实例 */
    private static ?PDO $instance = null;
    
    /** @var array 数据库配置 */
    private static array $config = [];
    
    /** @var bool 是否启用查询日志 */
    private static bool $enableQueryLog = false;

    /**
     * 获取数据库连接实例(单例模式)
     * 
     * @return PDO
     * @throws PDOException
     */
    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            self::$config = require __DIR__ . '/../../config/database.php';
            
            $dsn = sprintf(
                '%s:host=%s;port=%s;dbname=%s;charset=%s',
                self::$config['driver'],
                self::$config['host'],
                self::$config['port'],
                self::$config['database'],
                self::$config['charset']
            );

            try {
                self::$instance = new PDO($dsn, self::$config['username'], self::$config['password'], [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
                Logger::info("数据库连接成功", ['host' => self::$config['host'], 'database' => self::$config['database']]);
            } catch (PDOException $e) {
                Logger::critical("数据库连接失败", ['error' => $e->getMessage()]);
                throw $e;
            }
        }

        return self::$instance;
    }

    /**
     * 启用/禁用查询日志
     */
    public static function enableQueryLog(bool $enable = true): void
    {
        self::$enableQueryLog = $enable;
    }

    /**
     * 执行查询并返回所有结果
     * 
     * @param string $sql SQL语句
     * @param array $params 绑定参数
     * @return array
     */
    public static function fetchAll(string $sql, array $params = []): array
    {
        $start = microtime(true);
        try {
            $stmt = self::getInstance()->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetchAll();
            
            if (self::$enableQueryLog) {
                Logger::query($sql, $params, microtime(true) - $start);
            }
            
            return $result;
        } catch (PDOException $e) {
            Logger::error("SQL查询失败", ['sql' => $sql, 'params' => $params, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * 执行查询并返回单条结果
     * 
     * @param string $sql SQL语句
     * @param array $params 绑定参数
     * @return array|null
     */
    public static function fetchOne(string $sql, array $params = []): ?array
    {
        $start = microtime(true);
        try {
            $stmt = self::getInstance()->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetch();
            
            if (self::$enableQueryLog) {
                Logger::query($sql, $params, microtime(true) - $start);
            }
            
            return $result ?: null;
        } catch (PDOException $e) {
            Logger::error("SQL查询失败", ['sql' => $sql, 'params' => $params, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * 执行INSERT/UPDATE/DELETE语句
     * 
     * @param string $sql SQL语句
     * @param array $params 绑定参数
     * @return int 影响行数
     */
    public static function execute(string $sql, array $params = []): int
    {
        $start = microtime(true);
        try {
            $stmt = self::getInstance()->prepare($sql);
            $stmt->execute($params);
            $rowCount = $stmt->rowCount();
            
            if (self::$enableQueryLog) {
                Logger::query($sql, $params, microtime(true) - $start);
            }
            
            return $rowCount;
        } catch (PDOException $e) {
            Logger::error("SQL执行失败", ['sql' => $sql, 'params' => $params, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * 获取最后插入的ID
     * 
     * @return string
     */
    public static function lastInsertId(): string
    {
        return self::getInstance()->lastInsertId();
    }

    /**
     * 开始事务
     * 
     * @return bool
     */
    public static function beginTransaction(): bool
    {
        return self::getInstance()->beginTransaction();
    }

    /**
     * 提交事务
     * 
     * @return bool
     */
    public static function commit(): bool
    {
        return self::getInstance()->commit();
    }

    /**
     * 回滚事务
     * 
     * @return bool
     */
    public static function rollback(): bool
    {
        return self::getInstance()->rollBack();
    }

    /**
     * 构建分页查询
     * 
     * @param string $sql 基础SQL
     * @param array $params 参数
     * @param int $page 页码
     * @param int $perPage 每页数量
     * @return array ['data' => [], 'total' => int, 'page' => int, 'per_page' => int, 'total_pages' => int]
     */
    public static function paginate(string $sql, array $params = [], int $page = 1, int $perPage = 20): array
    {
        // 获取总数
        $countSql = preg_replace('/SELECT\s+.*?\s+FROM/is', 'SELECT COUNT(*) as total FROM', $sql);
        $countSql = preg_replace('/ORDER BY.*$/i', '', $countSql);
        $total = (int) self::fetchOne($countSql, $params)['total'];

        // 计算分页
        $totalPages = ceil($total / $perPage);
        $offset = ($page - 1) * $perPage;

        // 获取数据
        $sql .= " LIMIT {$offset}, {$perPage}";
        $data = self::fetchAll($sql, $params);

        return [
            'data' => $data,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => $totalPages,
        ];
    }
}
