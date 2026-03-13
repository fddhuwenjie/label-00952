<?php
/**
 * 仪表盘控制器
 * 
 * @package XianyuManager\Controllers
 */

namespace App\Controllers;

use App\Models\XianyuAccount;
use App\Models\Product;
use App\Models\Order;
use App\Models\Coupon;
use App\Models\ChatSession;
use App\Models\Notification;
use App\Utils\Response;
use App\Utils\Database;
use App\Middleware\AuthMiddleware;

class DashboardController
{
    /**
     * 获取仪表盘统计数据
     * 
     * GET /api/v1/dashboard/stats
     * 
     * @return void
     */
    public static function stats(): void
    {
        $user = AuthMiddleware::authenticate();

        // 账号统计
        $accountStats = XianyuAccount::getStatusStats();

        // 商品统计
        $productStats = Product::getStatusStats();

        // 订单统计
        $orderStats = Order::getStatusStats();
        $todayOrderStats = Order::getTodayStats();

        // 卡券统计
        $couponStats = Coupon::getStatusStats();

        // 未读消息
        $unreadMessages = ChatSession::getTotalUnread();

        // 未读通知
        $unreadNotifications = Notification::getUnreadCount($user['id']);

        Response::success([
            'accounts' => $accountStats,
            'products' => $productStats,
            'orders' => $orderStats,
            'today_orders' => $todayOrderStats,
            'coupons' => $couponStats,
            'unread_messages' => $unreadMessages,
            'unread_notifications' => $unreadNotifications,
        ]);
    }

    /**
     * 获取最近订单
     * 
     * GET /api/v1/dashboard/recent-orders
     * 
     * @return void
     */
    public static function recentOrders(): void
    {
        AuthMiddleware::authenticate();

        $limit = (int) ($_GET['limit'] ?? 10);
        $limit = min($limit, 50);

        $sql = "SELECT o.*, p.title as product_title 
                FROM orders o 
                LEFT JOIN products p ON o.product_id = p.id
                ORDER BY o.id DESC 
                LIMIT ?";

        $orders = Database::fetchAll($sql, [$limit]);
        Response::success($orders);
    }

    /**
     * 获取销售趋势(最近7天)
     * 
     * GET /api/v1/dashboard/sales-trend
     * 
     * @return void
     */
    public static function salesTrend(): void
    {
        AuthMiddleware::authenticate();

        $days = (int) ($_GET['days'] ?? 7);
        $days = min($days, 30);

        $sql = "SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as order_count,
                    COALESCE(SUM(total_amount), 0) as total_amount
                FROM orders 
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                GROUP BY DATE(created_at)
                ORDER BY date ASC";

        $trend = Database::fetchAll($sql, [$days]);

        // 填充缺失的日期
        $result = [];
        $startDate = new \DateTime("-{$days} days");
        $endDate = new \DateTime();
        
        $trendMap = [];
        foreach ($trend as $row) {
            $trendMap[$row['date']] = $row;
        }

        while ($startDate <= $endDate) {
            $date = $startDate->format('Y-m-d');
            $result[] = [
                'date' => $date,
                'order_count' => (int) ($trendMap[$date]['order_count'] ?? 0),
                'total_amount' => (float) ($trendMap[$date]['total_amount'] ?? 0),
            ];
            $startDate->modify('+1 day');
        }

        Response::success($result);
    }

    /**
     * 获取热销商品
     * 
     * GET /api/v1/dashboard/hot-products
     * 
     * @return void
     */
    public static function hotProducts(): void
    {
        AuthMiddleware::authenticate();

        $limit = (int) ($_GET['limit'] ?? 10);
        $limit = min($limit, 50);

        $sql = "SELECT id, title, price, sold_count, stock, status
                FROM products 
                ORDER BY sold_count DESC 
                LIMIT ?";

        $products = Database::fetchAll($sql, [$limit]);
        Response::success($products);
    }
}
