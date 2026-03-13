<?php
/**
 * 基础模型类
 * 
 * 提供基本的CRUD操作
 * 
 * @package XianyuManager\Models
 */

namespace App\Models;

use App\Utils\Database;

abstract class BaseModel
{
    /** @var string 表名 */
    protected static string $table = '';

    /** @var string 主键 */
    protected static string $primaryKey = 'id';

    /**
     * 获取所有记录
     * 
     * @param array $conditions WHERE条件
     * @param string $orderBy 排序
     * @return array
     */
    public static function all(array $conditions = [], string $orderBy = 'id DESC'): array
    {
        $sql = "SELECT * FROM " . static::$table;
        $params = [];

        if (!empty($conditions)) {
            $where = [];
            foreach ($conditions as $key => $value) {
                $where[] = "`{$key}` = ?";
                $params[] = $value;
            }
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        $sql .= " ORDER BY {$orderBy}";

        return Database::fetchAll($sql, $params);
    }

    /**
     * 根据ID获取记录
     * 
     * @param int $id 主键ID
     * @return array|null
     */
    public static function find(int $id): ?array
    {
        $sql = "SELECT * FROM " . static::$table . " WHERE " . static::$primaryKey . " = ?";
        return Database::fetchOne($sql, [$id]);
    }

    /**
     * 根据条件获取单条记录
     * 
     * @param array $conditions WHERE条件
     * @return array|null
     */
    public static function findBy(array $conditions): ?array
    {
        $sql = "SELECT * FROM " . static::$table;
        $params = [];
        $where = [];

        foreach ($conditions as $key => $value) {
            $where[] = "`{$key}` = ?";
            $params[] = $value;
        }

        $sql .= " WHERE " . implode(' AND ', $where);

        return Database::fetchOne($sql, $params);
    }

    /**
     * 创建记录
     * 
     * @param array $data 数据
     * @return int 新记录ID
     */
    public static function create(array $data): int
    {
        $columns = implode(', ', array_map(fn($k) => "`{$k}`", array_keys($data)));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));

        $sql = "INSERT INTO " . static::$table . " ({$columns}) VALUES ({$placeholders})";
        Database::execute($sql, array_values($data));

        return (int) Database::lastInsertId();
    }

    /**
     * 更新记录
     * 
     * @param int $id 主键ID
     * @param array $data 数据
     * @return int 影响行数
     */
    public static function update(int $id, array $data): int
    {
        $set = [];
        $params = [];

        foreach ($data as $key => $value) {
            $set[] = "`{$key}` = ?";
            $params[] = $value;
        }

        $params[] = $id;
        $sql = "UPDATE " . static::$table . " SET " . implode(', ', $set) . " WHERE `" . static::$primaryKey . "` = ?";

        return Database::execute($sql, $params);
    }

    /**
     * 删除记录
     * 
     * @param int $id 主键ID
     * @return int 影响行数
     */
    public static function delete(int $id): int
    {
        $sql = "DELETE FROM " . static::$table . " WHERE " . static::$primaryKey . " = ?";
        return Database::execute($sql, [$id]);
    }

    /**
     * 分页查询
     * 
     * @param int $page 页码
     * @param int $perPage 每页数量
     * @param array $conditions WHERE条件
     * @param string $orderBy 排序
     * @return array
     */
    public static function paginate(int $page = 1, int $perPage = 20, array $conditions = [], string $orderBy = 'id DESC'): array
    {
        $sql = "SELECT * FROM " . static::$table;
        $params = [];

        if (!empty($conditions)) {
            $where = [];
            foreach ($conditions as $key => $value) {
                if (is_array($value)) {
                    $where[] = "`{$key}` {$value['operator']} ?";
                    $params[] = $value['value'];
                } else {
                    $where[] = "`{$key}` = ?";
                    $params[] = $value;
                }
            }
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        $sql .= " ORDER BY {$orderBy}";

        return Database::paginate($sql, $params, $page, $perPage);
    }

    /**
     * 统计数量
     * 
     * @param array $conditions WHERE条件
     * @return int
     */
    public static function count(array $conditions = []): int
    {
        $sql = "SELECT COUNT(*) as total FROM " . static::$table;
        $params = [];

        if (!empty($conditions)) {
            $where = [];
            foreach ($conditions as $key => $value) {
                $where[] = "`{$key}` = ?";
                $params[] = $value;
            }
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        $result = Database::fetchOne($sql, $params);
        return (int) ($result['total'] ?? 0);
    }

    /**
     * 批量插入
     * 
     * @param array $rows 多行数据
     * @return int 影响行数
     */
    public static function batchInsert(array $rows): int
    {
        if (empty($rows)) {
            return 0;
        }

        $columns = array_keys($rows[0]);
        $placeholders = '(' . implode(', ', array_fill(0, count($columns), '?')) . ')';
        $allPlaceholders = implode(', ', array_fill(0, count($rows), $placeholders));

        $sql = "INSERT INTO " . static::$table . " (" . implode(', ', array_map(fn($c) => "`{$c}`", $columns)) . ") VALUES {$allPlaceholders}";

        $params = [];
        foreach ($rows as $row) {
            foreach ($columns as $col) {
                $params[] = $row[$col] ?? null;
            }
        }

        return Database::execute($sql, $params);
    }
}
