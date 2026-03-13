<?php
/**
 * 商品模型
 * 
 * @package XianyuManager\Models
 */

namespace App\Models;

use App\Utils\Database;

class Product extends BaseModel
{
    protected static string $table = 'products';

    /**
     * 获取带分类和账号信息的商品列表
     * 
     * @param int $page 页码
     * @param int $perPage 每页数量
     * @param array $filters 筛选条件
     * @return array
     */
    public static function getWithRelations(int $page = 1, int $perPage = 20, array $filters = []): array
    {
        $sql = "SELECT p.*, c.name as category_name, a.name as account_name 
                FROM products p 
                LEFT JOIN product_categories c ON p.category_id = c.id
                LEFT JOIN xianyu_accounts a ON p.account_id = a.id";
        
        $params = [];
        $where = [];

        if (!empty($filters['status'])) {
            $where[] = "p.status = ?";
            $params[] = $filters['status'];
        }

        if (!empty($filters['category_id'])) {
            $where[] = "p.category_id = ?";
            $params[] = $filters['category_id'];
        }

        if (!empty($filters['account_id'])) {
            $where[] = "p.account_id = ?";
            $params[] = $filters['account_id'];
        }

        if (!empty($filters['keyword'])) {
            $where[] = "(p.title LIKE ? OR p.description LIKE ?)";
            $params[] = "%{$filters['keyword']}%";
            $params[] = "%{$filters['keyword']}%";
        }

        if (!empty($where)) {
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        $sql .= " ORDER BY p.id DESC";

        return Database::paginate($sql, $params, $page, $perPage);
    }

    /**
     * 统计各状态商品数量
     * 
     * @return array
     */
    public static function getStatusStats(): array
    {
        $sql = "SELECT status, COUNT(*) as count FROM products GROUP BY status";
        $results = Database::fetchAll($sql);
        
        $stats = ['draft' => 0, 'online' => 0, 'offline' => 0, 'sold_out' => 0, 'total' => 0];
        foreach ($results as $row) {
            $stats[$row['status']] = (int) $row['count'];
            $stats['total'] += (int) $row['count'];
        }

        return $stats;
    }

    /**
     * 减少库存
     * 
     * @param int $productId 商品ID
     * @param int $quantity 数量
     * @return bool
     */
    public static function decreaseStock(int $productId, int $quantity = 1): bool
    {
        $sql = "UPDATE products SET stock = stock - ?, sold_count = sold_count + ? WHERE id = ? AND stock >= ?";
        $affected = Database::execute($sql, [$quantity, $quantity, $productId, $quantity]);
        return $affected > 0;
    }
}
