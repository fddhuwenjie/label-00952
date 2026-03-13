<?php
/**
 * 闲鱼账号模型
 * 
 * @package XianyuManager\Models
 */

namespace App\Models;

use App\Utils\Database;

class XianyuAccount extends BaseModel
{
    protected static string $table = 'xianyu_accounts';

    /**
     * 获取带分组信息的账号列表
     * 
     * @param int $page 页码
     * @param int $perPage 每页数量
     * @param array $filters 筛选条件
     * @return array
     */
    public static function getWithGroup(int $page = 1, int $perPage = 20, array $filters = []): array
    {
        $sql = "SELECT a.*, g.name as group_name 
                FROM xianyu_accounts a 
                LEFT JOIN account_groups g ON a.group_id = g.id";
        
        $params = [];
        $where = [];

        if (!empty($filters['status'])) {
            $where[] = "a.status = ?";
            $params[] = $filters['status'];
        }

        if (!empty($filters['group_id'])) {
            $where[] = "a.group_id = ?";
            $params[] = $filters['group_id'];
        }

        if (!empty($filters['keyword'])) {
            $where[] = "(a.name LIKE ? OR a.xianyu_id LIKE ?)";
            $params[] = "%{$filters['keyword']}%";
            $params[] = "%{$filters['keyword']}%";
        }

        if (!empty($where)) {
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        $sql .= " ORDER BY a.id DESC";

        return Database::paginate($sql, $params, $page, $perPage);
    }

    /**
     * 统计各状态账号数量
     * 
     * @return array
     */
    public static function getStatusStats(): array
    {
        $sql = "SELECT status, COUNT(*) as count FROM xianyu_accounts GROUP BY status";
        $results = Database::fetchAll($sql);
        
        $stats = ['online' => 0, 'offline' => 0, 'error' => 0, 'total' => 0];
        foreach ($results as $row) {
            $stats[$row['status']] = (int) $row['count'];
            $stats['total'] += (int) $row['count'];
        }

        return $stats;
    }
}
