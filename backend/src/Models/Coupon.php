<?php
/**
 * 卡券模型
 * 
 * @package XianyuManager\Models
 */

namespace App\Models;

use App\Utils\Database;

class Coupon extends BaseModel
{
    protected static string $table = 'coupons';

    /**
     * 获取带分类信息的卡券列表
     * 
     * @param int $page 页码
     * @param int $perPage 每页数量
     * @param array $filters 筛选条件
     * @return array
     */
    public static function getWithCategory(int $page = 1, int $perPage = 20, array $filters = []): array
    {
        $sql = "SELECT c.*, cc.name as category_name, p.title as product_title 
                FROM coupons c 
                LEFT JOIN coupon_categories cc ON c.category_id = cc.id
                LEFT JOIN products p ON c.product_id = p.id";
        
        $params = [];
        $where = [];

        if (!empty($filters['status'])) {
            $where[] = "c.status = ?";
            $params[] = $filters['status'];
        }

        if (!empty($filters['category_id'])) {
            $where[] = "c.category_id = ?";
            $params[] = $filters['category_id'];
        }

        if (!empty($filters['product_id'])) {
            $where[] = "c.product_id = ?";
            $params[] = $filters['product_id'];
        }

        if (!empty($filters['keyword'])) {
            $where[] = "c.code LIKE ?";
            $params[] = "%{$filters['keyword']}%";
        }

        if (!empty($where)) {
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        $sql .= " ORDER BY c.id DESC";

        return Database::paginate($sql, $params, $page, $perPage);
    }

    /**
     * 获取可用的卡券(用于发货)
     * 
     * @param int $productId 商品ID
     * @param int $count 数量
     * @return array
     */
    public static function getAvailableForDelivery(int $productId, int $count = 1): array
    {
        $sql = "SELECT * FROM coupons 
                WHERE product_id = ? AND status = 'available' 
                AND (expire_at IS NULL OR expire_at > NOW())
                ORDER BY id ASC 
                LIMIT ?";
        
        return Database::fetchAll($sql, [$productId, $count]);
    }

    /**
     * 标记卡券为已使用
     * 
     * @param int $couponId 卡券ID
     * @param int $orderId 订单ID
     * @return bool
     */
    public static function markAsUsed(int $couponId, int $orderId): bool
    {
        $sql = "UPDATE coupons SET status = 'used', used_at = NOW(), used_order_id = ? WHERE id = ? AND status = 'available'";
        $affected = Database::execute($sql, [$orderId, $couponId]);
        return $affected > 0;
    }

    /**
     * 统计各状态卡券数量
     * 
     * @param int|null $productId 商品ID(可选)
     * @return array
     */
    public static function getStatusStats(?int $productId = null): array
    {
        $sql = "SELECT status, COUNT(*) as count FROM coupons";
        $params = [];

        if ($productId !== null) {
            $sql .= " WHERE product_id = ?";
            $params[] = $productId;
        }

        $sql .= " GROUP BY status";
        $results = Database::fetchAll($sql, $params);
        
        $stats = ['available' => 0, 'used' => 0, 'expired' => 0, 'total' => 0];
        foreach ($results as $row) {
            $stats[$row['status']] = (int) $row['count'];
            $stats['total'] += (int) $row['count'];
        }

        return $stats;
    }
}
