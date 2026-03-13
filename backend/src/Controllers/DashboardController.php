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
                'day' => $startDate->format('m-d'),
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
     * 获取订单状态分布统计
     * 
     * GET /api/v1/dashboard/order-status-distribution
     * 
     * @return void
     */
    public static function orderStatusDistribution(): void
    {
        AuthMiddleware::authenticate();

        $sql = "SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as amount
                FROM orders 
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY status";

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
                'value' => (int) $row['count'],
                'amount' => (float) $row['amount'],
                'status' => $row['status']
            ];
        }

        Response::success($distribution);
    }

    /**
     * 获取商品销售排行
     * 
     * GET /api/v1/dashboard/product-sales-rank
     * 
     * @return void
     */
    public static function productSalesRank(): void
    {
        AuthMiddleware::authenticate();

        $limit = (int) ($_GET['limit'] ?? 10);
        $limit = min($limit, 20);

        $sql = "SELECT p.id, p.title, 
                       COUNT(o.id) as order_count, 
                       COALESCE(SUM(o.total_amount), 0) as total_sales
                FROM products p
                LEFT JOIN orders o ON p.id = o.product_id AND o.status = 'completed'
                WHERE p.status = 'online'
                GROUP BY p.id, p.title
                ORDER BY total_sales DESC
                LIMIT ?";

        $products = Database::fetchAll($sql, [$limit]);
        
        // 转换字段名以匹配前端期望
        $result = [];
        foreach ($products as $product) {
            $result[] = [
                'id' => $product['id'],
                'name' => $product['title'],
                'sales' => (int) $product['order_count'],
                'amount' => (float) $product['total_sales'],
            ];
        }
        
        Response::success($result);
    }

    /**
     * 获取小时订单趋势（今日）
     * 
     * GET /api/v1/dashboard/hourly-trend
     * 
     * @return void
     */
    public static function hourlyTrend(): void
    {
        AuthMiddleware::authenticate();

        $sql = "SELECT 
                    HOUR(created_at) as hour,
                    COUNT(*) as order_count,
                    COALESCE(SUM(total_amount), 0) as total_amount
                FROM orders 
                WHERE DATE(created_at) = CURDATE()
                GROUP BY HOUR(created_at)
                ORDER BY hour ASC";

        $trend = Database::fetchAll($sql);

        // 填充所有小时
        $result = [];
        for ($i = 0; $i < 24; $i++) {
            $found = false;
            foreach ($trend as $row) {
                if ((int) $row['hour'] === $i) {
                    $result[] = [
                        'hour' => sprintf('%02d:00', $i),
                        'order_count' => (int) $row['order_count'],
                        'total_amount' => (float) $row['total_amount'],
                    ];
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                $result[] = [
                    'hour' => sprintf('%02d:00', $i),
                    'order_count' => 0,
                    'total_amount' => 0,
                ];
            }
        }

        Response::success($result);
    }

    /**
     * 获取周销售趋势
     * 
     * GET /api/v1/dashboard/weekly-trend
     * 
     * @return void
     */
    public static function weeklyTrend(): void
    {
        AuthMiddleware::authenticate();

        $weeks = (int) ($_GET['weeks'] ?? 7);
        $weeks = min($weeks, 12);

        $sql = "SELECT 
                    YEARWEEK(created_at, 1) as week_key,
                    DATE_FORMAT(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY), '%Y-%m-%d') as week_start,
                    COUNT(*) as order_count,
                    COALESCE(SUM(total_amount), 0) as total_amount
                FROM orders 
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? WEEK)
                GROUP BY YEARWEEK(created_at, 1), week_start
                ORDER BY week_start ASC";

        $trend = Database::fetchAll($sql, [$weeks]);

        // 填充最近N周
        $result = [];
        $trendMap = [];
        foreach ($trend as $row) {
            $trendMap[$row['week_start']] = $row;
        }

        for ($i = $weeks - 1; $i >= 0; $i--) {
            $date = new \DateTime();
            $date->modify("-{$i} weeks");
            $date->modify('monday this week');
            $weekStart = $date->format('Y-m-d');
            $result[] = [
                'week' => $weekStart,
                'day' => $date->format('m-d') . '周',
                'order_count' => (int) ($trendMap[$weekStart]['order_count'] ?? 0),
                'total_amount' => (float) ($trendMap[$weekStart]['total_amount'] ?? 0),
            ];
        }

        Response::success($result);
    }

    /**
     * 获取月销售趋势
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

        // 填充所有月份
        $result = [];
        $trendMap = [];
        foreach ($trend as $row) {
            $trendMap[$row['month']] = $row;
        }

        for ($i = $months - 1; $i >= 0; $i--) {
            $month = date('Y-m', strtotime("-{$i} months"));
            $result[] = [
                'month' => $month,
                'day' => date('Y年m月', strtotime("-{$i} months")),
                'order_count' => (int) ($trendMap[$month]['order_count'] ?? 0),
                'total_amount' => (float) ($trendMap[$month]['total_amount'] ?? 0),
            ];
        }

        Response::success($result);
    }

    /**
     * 获取商品类别销售统计
     * 
     * GET /api/v1/dashboard/category-stats
     * 
     * @return void
     */
    public static function categoryStats(): void
    {
        AuthMiddleware::authenticate();

        $days = (int) ($_GET['days'] ?? 30);
        $days = min($days, 90);

        $sql = "SELECT 
                    c.id,
                    c.name,
                    COUNT(o.id) as order_count,
                    COALESCE(SUM(o.total_amount), 0) as total_amount,
                    COUNT(DISTINCT p.id) as product_count
                FROM product_categories c
                LEFT JOIN products p ON c.id = p.category_id
                LEFT JOIN orders o ON p.id = o.product_id AND o.status = 'completed' AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                WHERE c.parent_id = 0
                GROUP BY c.id, c.name
                ORDER BY total_amount DESC";

        $categories = Database::fetchAll($sql, [$days]);

        $result = [];
        foreach ($categories as $cat) {
            $result[] = [
                'id' => $cat['id'],
                'name' => $cat['name'],
                'order_count' => (int) $cat['order_count'],
                'amount' => (float) $cat['total_amount'],
                'product_count' => (int) $cat['product_count'],
            ];
        }

        Response::success($result);
    }
}
