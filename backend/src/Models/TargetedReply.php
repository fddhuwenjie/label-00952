<?php
/**
 * 指定回复模型
 * 
 * @package XianyuManager\Models
 */

namespace App\Models;

use App\Utils\Database;

class TargetedReply extends BaseModel
{
    protected static string $table = 'targeted_replies';

    /**
     * 获取匹配的指定回复规则
     * 
     * @param string $targetType 目标类型
     * @param string $targetId 目标ID
     * @return array|null
     */
    public static function findMatchingRule(string $targetType, string $targetId): ?array
    {
        $currentTime = date('H:i:s');
        
        $sql = "SELECT * FROM targeted_replies 
                WHERE status = 1 
                AND target_type = ? 
                AND target_id = ?
                AND (time_start IS NULL OR time_start <= ?)
                AND (time_end IS NULL OR time_end >= ?)
                ORDER BY priority DESC 
                LIMIT 1";
        
        return Database::fetchOne($sql, [$targetType, $targetId, $currentTime, $currentTime]);
    }

    /**
     * 获取规则列表
     * 
     * @param int $page 页码
     * @param int $perPage 每页数量
     * @param array $filters 筛选条件
     * @return array
     */
    public static function getList(int $page = 1, int $perPage = 20, array $filters = []): array
    {
        $sql = "SELECT * FROM targeted_replies";
        
        $params = [];
        $where = [];

        if (isset($filters['status'])) {
            $where[] = "status = ?";
            $params[] = $filters['status'];
        }

        if (!empty($filters['target_type'])) {
            $where[] = "target_type = ?";
            $params[] = $filters['target_type'];
        }

        if (!empty($filters['keyword'])) {
            $where[] = "(name LIKE ? OR reply_content LIKE ?)";
            $params[] = "%{$filters['keyword']}%";
            $params[] = "%{$filters['keyword']}%";
        }

        if (!empty($where)) {
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        $sql .= " ORDER BY priority DESC, id DESC";

        return Database::paginate($sql, $params, $page, $perPage);
    }
}
