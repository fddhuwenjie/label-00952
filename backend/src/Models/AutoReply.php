<?php
/**
 * 自动回复模型
 * 
 * @package XianyuManager\Models
 */

namespace App\Models;

use App\Utils\Database;

class AutoReply extends BaseModel
{
    protected static string $table = 'auto_replies';

    /**
     * 获取匹配的自动回复规则
     * 
     * @param string $message 消息内容
     * @param int|null $accountId 账号ID
     * @param int|null $productId 商品ID
     * @return array|null
     */
    public static function findMatchingRule(string $message, ?int $accountId = null, ?int $productId = null): ?array
    {
        $sql = "SELECT * FROM auto_replies WHERE status = 1 
                AND (account_id IS NULL OR account_id = ?)
                AND (product_id IS NULL OR product_id = ?)
                ORDER BY priority DESC, id ASC";
        
        $rules = Database::fetchAll($sql, [$accountId, $productId]);

        foreach ($rules as $rule) {
            $keywords = json_decode($rule['keywords'], true) ?: [];
            
            foreach ($keywords as $keyword) {
                $matched = false;
                
                switch ($rule['match_type']) {
                    case 'exact':
                        $matched = ($message === $keyword);
                        break;
                    case 'contains':
                        $matched = (mb_strpos($message, $keyword) !== false);
                        break;
                    case 'regex':
                        $matched = preg_match($keyword, $message);
                        break;
                }

                if ($matched) {
                    return $rule;
                }
            }
        }

        return null;
    }

    /**
     * 获取规则列表(带关联信息)
     * 
     * @param int $page 页码
     * @param int $perPage 每页数量
     * @param array $filters 筛选条件
     * @return array
     */
    public static function getWithRelations(int $page = 1, int $perPage = 20, array $filters = []): array
    {
        $sql = "SELECT r.*, a.name as account_name, p.title as product_title 
                FROM auto_replies r 
                LEFT JOIN xianyu_accounts a ON r.account_id = a.id
                LEFT JOIN products p ON r.product_id = p.id";
        
        $params = [];
        $where = [];

        if (isset($filters['status'])) {
            $where[] = "r.status = ?";
            $params[] = $filters['status'];
        }

        if (!empty($filters['keyword'])) {
            $where[] = "(r.name LIKE ? OR r.reply_content LIKE ?)";
            $params[] = "%{$filters['keyword']}%";
            $params[] = "%{$filters['keyword']}%";
        }

        if (!empty($where)) {
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        $sql .= " ORDER BY r.priority DESC, r.id DESC";

        return Database::paginate($sql, $params, $page, $perPage);
    }
}
