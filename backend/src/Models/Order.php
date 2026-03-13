<?php
/**
 * 订单模型
 * 
 * @package XianyuManager\Models
 */

namespace App\Models;

use App\Utils\Database;

class Order extends BaseModel
{
    protected static string $table = 'orders';

    /**
     * 生成订单号
     * 
     * @return string
     */
    public static function generateOrderNo(): string
    {
        return 'XY' . date('YmdHis') . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }

    /**
     * 获取带关联信息的订单列表
     * 
     * @param int $page 页码
     * @param int $perPage 每页数量
     * @param array $filters 筛选条件
     * @return array
     */
    public static function getWithRelations(int $page = 1, int $perPage = 20, array $filters = []): array
    {
        $sql = "SELECT o.*, p.title as product_title, a.name as account_name 
                FROM orders o 
                LEFT JOIN products p ON o.product_id = p.id
                LEFT JOIN xianyu_accounts a ON o.account_id = a.id";
        
        $params = [];
        $where = [];

        if (!empty($filters['status'])) {
            $where[] = "o.status = ?";
            $params[] = $filters['status'];
        }

        if (!empty($filters['account_id'])) {
            $where[] = "o.account_id = ?";
            $params[] = $filters['account_id'];
        }

        if (!empty($filters['keyword'])) {
            $where[] = "(o.order_no LIKE ? OR o.buyer_name LIKE ? OR p.title LIKE ?)";
            $params[] = "%{$filters['keyword']}%";
            $params[] = "%{$filters['keyword']}%";
            $params[] = "%{$filters['keyword']}%";
        }

        if (!empty($filters['start_date'])) {
            $where[] = "o.created_at >= ?";
            $params[] = $filters['start_date'] . ' 00:00:00';
        }

        if (!empty($filters['end_date'])) {
            $where[] = "o.created_at <= ?";
            $params[] = $filters['end_date'] . ' 23:59:59';
        }

        if (!empty($where)) {
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        $sql .= " ORDER BY o.id DESC";

        return Database::paginate($sql, $params, $page, $perPage);
    }

    /**
     * 统计各状态订单数量
     * 
     * @return array
     */
    public static function getStatusStats(): array
    {
        $sql = "SELECT status, COUNT(*) as count FROM orders GROUP BY status";
        $results = Database::fetchAll($sql);
        
        $stats = ['pending' => 0, 'paid' => 0, 'shipped' => 0, 'completed' => 0, 'refunded' => 0, 'cancelled' => 0, 'total' => 0];
        foreach ($results as $row) {
            $stats[$row['status']] = (int) $row['count'];
            $stats['total'] += (int) $row['count'];
        }

        return $stats;
    }

    /**
     * 获取今日统计
     * 
     * @return array
     */
    public static function getTodayStats(): array
    {
        $today = date('Y-m-d');
        
        $sql = "SELECT 
                    COUNT(*) as order_count,
                    COALESCE(SUM(total_amount), 0) as total_amount,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
                FROM orders 
                WHERE DATE(created_at) = ?";
        
        return Database::fetchOne($sql, [$today]) ?: ['order_count' => 0, 'total_amount' => 0, 'completed_count' => 0];
    }
}
