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

    /**
     * 获取订单状态分布
     * 
     * GET /api/v1/dashboard/order-status-distribution
     * 
     * @return void
     */
    public static function orderStatusDistribution(): void
    {
        AuthMiddleware::authenticate();

        $sql = "SELECT status, COUNT(*) as value FROM orders GROUP BY status";
        $results = Database::fetchAll($sql);

        $statusMap = [
            'pending' => '待支付',
            'paid' => '已支付',
            'shipped' => '已发货',
            'completed' => '已完成',
            'refunded' => '已退款',
            'cancelled' => '已取消'
        ];

        $distribution = [];
        foreach ($results as $row) {
            $distribution[] = [
                'name' => $statusMap[$row['status']] ?? $row['status'],
                'value' => (int)$row['value'],
                'status' => $row['status']
            ];
        }

        Response::success($distribution);
    }

    /**
     * 获取商品分类统计
     * 
     * GET /api/v1/dashboard/category-stats
     * 
     * @return void
     */
    public static function categoryStats(): void
    {
        AuthMiddleware::authenticate();

        $sql = "SELECT 
                    c.name,
                    COUNT(p.id) as product_count,
                    COALESCE(SUM(p.sold_count), 0) as sold_count
                FROM product_categories c
                LEFT JOIN products p ON c.id = p.category_id
                WHERE c.parent_id = 0
                GROUP BY c.id, c.name
                ORDER BY sold_count DESC";

        $stats = Database::fetchAll($sql);

        $result = [];
        foreach ($stats as $row) {
            $result[] = [
                'name' => $row['name'],
                'product_count' => (int)$row['product_count'],
                'sold_count' => (int)$row['sold_count']
            ];
        }

        Response::success($result);
    }

    /**
     * 获取账号销售排行
     * 
     * GET /api/v1/dashboard/account-sales-rank
     * 
     * @return void
     */
    public static function accountSalesRank(): void
    {
        AuthMiddleware::authenticate();

        $limit = (int) ($_GET['limit'] ?? 10);
        $limit = min($limit, 50);

        $sql = "SELECT 
                    a.name,
                    COUNT(o.id) as order_count,
                    COALESCE(SUM(o.total_amount), 0) as total_amount
                FROM xianyu_accounts a
                LEFT JOIN orders o ON a.id = o.account_id
                GROUP BY a.id, a.name
                ORDER BY total_amount DESC
                LIMIT ?";

        $rank = Database::fetchAll($sql, [$limit]);

        $result = [];
        foreach ($rank as $row) {
            $result[] = [
                'name' => $row['name'],
                'order_count' => (int)$row['order_count'],
                'total_amount' => (float)$row['total_amount']
            ];
        }

        Response::success($result);
    }

    /**
     * 获取每小时订单统计(最近24小时)
     * 
     * GET /api/v1/dashboard/hourly-orders
     * 
     * @return void
     */
    public static function hourlyOrders(): void
    {
        AuthMiddleware::authenticate();

        $sql = "SELECT 
                    HOUR(created_at) as hour,
                    COUNT(*) as order_count,
                    COALESCE(SUM(total_amount), 0) as total_amount
                FROM orders 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                GROUP BY HOUR(created_at)
                ORDER BY hour ASC";

        $results = Database::fetchAll($sql);

        // 填充24小时
        $hourlyData = [];
        for ($i = 0; $i < 24; $i++) {
            $hourlyData[$i] = [
                'hour' => $i,
                'order_count' => 0,
                'total_amount' => 0
            ];
        }
        foreach ($results as $row) {
            $hour = (int)$row['hour'];
            $hourlyData[$hour] = [
                'hour' => $hour,
                'order_count' => (int)$row['order_count'],
                'total_amount' => (float)$row['total_amount']
            ];
        }

        Response::success($hourlyData);
    }

    /**
     * 获取月度销售趋势
     * 
     * GET /api/v1/dashboard/monthly-trend
     * 
     * @return void
     */
    public static function monthlyTrend(): void
    {
        AuthMiddleware::authenticate();

        $months = (int) ($_GET['months'] ?? 6);
        $months = min($months, 12);

        $sql = "SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as order_count,
                    COALESCE(SUM(total_amount), 0) as total_amount
                FROM orders 
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY month ASC";

        $trend = Database::fetchAll($sql, [$months]);

        // 填充缺失的月份
        $result = [];
        $startDate = new \DateTime("-{$months} months");
        $endDate = new \DateTime();
        
        $trendMap = [];
        foreach ($trend as $row) {
            $trendMap[$row['month']] = $row;
        }

        while ($startDate <= $endDate) {
            $month = $startDate->format('Y-m');
            $result[] = [
                'month' => $month,
                'order_count' => (int) ($trendMap[$month]['order_count'] ?? 0),
                'total_amount' => (float) ($trendMap[$month]['total_amount'] ?? 0),
            ];
            $startDate->modify('+1 month');
        }

        Response::success($result);
    }
}
