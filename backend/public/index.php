<?php
/**
 * 闲鱼管理系统 - API入口文件
 * 
 * @package XianyuManager
 */

// 错误报告
error_reporting(E_ALL);
ini_set('display_errors', 0);

// 时区设置
date_default_timezone_set('Asia/Shanghai');

// 自动加载
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/../src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

use App\Utils\Response;
use App\Middleware\CorsMiddleware;

// 处理CORS
CorsMiddleware::handle();

// 获取请求路径和方法
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$requestMethod = $_SERVER['REQUEST_METHOD'];

// 解析路径
$path = parse_url($requestUri, PHP_URL_PATH);
$path = rtrim($path, '/');

// 路由表
$routes = [
    // 认证
    'POST /api/v1/auth/login' => ['App\Controllers\AuthController', 'login'],
    'GET /api/v1/auth/me' => ['App\Controllers\AuthController', 'me'],
    'PUT /api/v1/auth/password' => ['App\Controllers\AuthController', 'changePassword'],
    'PUT /api/v1/auth/profile' => ['App\Controllers\AuthController', 'updateProfile'],
    'POST /api/v1/auth/refresh-api-key' => ['App\Controllers\AuthController', 'refreshApiKey'],

    // 仪表盘
    'GET /api/v1/dashboard/stats' => ['App\Controllers\DashboardController', 'stats'],
    'GET /api/v1/dashboard/recent-orders' => ['App\Controllers\DashboardController', 'recentOrders'],
    'GET /api/v1/dashboard/sales-trend' => ['App\Controllers\DashboardController', 'salesTrend'],
    'GET /api/v1/dashboard/hot-products' => ['App\Controllers\DashboardController', 'hotProducts'],

    // 账号管理
    'GET /api/v1/accounts' => ['App\Controllers\AccountController', 'index'],
    'GET /api/v1/accounts/stats' => ['App\Controllers\AccountController', 'stats'],
    'POST /api/v1/accounts' => ['App\Controllers\AccountController', 'store'],
    'GET /api/v1/account-groups' => ['App\Controllers\AccountController', 'groups'],
    'POST /api/v1/account-groups' => ['App\Controllers\AccountController', 'createGroup'],

    // 商品管理
    'GET /api/v1/products' => ['App\Controllers\ProductController', 'index'],
    'GET /api/v1/products/stats' => ['App\Controllers\ProductController', 'stats'],
    'POST /api/v1/products' => ['App\Controllers\ProductController', 'store'],
    'GET /api/v1/product-categories' => ['App\Controllers\ProductController', 'categories'],
    'POST /api/v1/product-categories' => ['App\Controllers\ProductController', 'createCategory'],

    // 订单管理
    'GET /api/v1/orders' => ['App\Controllers\OrderController', 'index'],
    'GET /api/v1/orders/stats' => ['App\Controllers\OrderController', 'stats'],
    'POST /api/v1/orders' => ['App\Controllers\OrderController', 'store'],

    // 卡券管理
    'GET /api/v1/coupons' => ['App\Controllers\CouponController', 'index'],
    'GET /api/v1/coupons/stats' => ['App\Controllers\CouponController', 'stats'],
    'POST /api/v1/coupons' => ['App\Controllers\CouponController', 'store'],
    'POST /api/v1/coupons/batch' => ['App\Controllers\CouponController', 'batchImport'],
    'GET /api/v1/coupon-categories' => ['App\Controllers\CouponController', 'categories'],
    'POST /api/v1/coupon-categories' => ['App\Controllers\CouponController', 'createCategory'],

    // 自动回复
    'GET /api/v1/auto-replies' => ['App\Controllers\ReplyController', 'autoReplyIndex'],
    'POST /api/v1/auto-replies' => ['App\Controllers\ReplyController', 'autoReplyStore'],

    // 指定回复
    'GET /api/v1/targeted-replies' => ['App\Controllers\ReplyController', 'targetedReplyIndex'],
    'POST /api/v1/targeted-replies' => ['App\Controllers\ReplyController', 'targetedReplyStore'],

    // 聊天
    'GET /api/v1/chat/sessions' => ['App\Controllers\ChatController', 'sessions'],
    'GET /api/v1/chat/unread' => ['App\Controllers\ChatController', 'unreadCount'],
    'GET /api/v1/chat/quick-replies' => ['App\Controllers\ChatController', 'quickReplies'],
    'POST /api/v1/chat/receive' => ['App\Controllers\ChatController', 'receiveMessage'],

    // 通知
    'GET /api/v1/notifications' => ['App\Controllers\NotificationController', 'index'],
    'GET /api/v1/notifications/unread-count' => ['App\Controllers\NotificationController', 'unreadCount'],
    'POST /api/v1/notifications/read-all' => ['App\Controllers\NotificationController', 'markAllAsRead'],

    // 配置
    'GET /api/v1/configs' => ['App\Controllers\ConfigController', 'index'],
    'PUT /api/v1/configs' => ['App\Controllers\ConfigController', 'batchUpdate'],
    'GET /api/v1/configs/public' => ['App\Controllers\ConfigController', 'publicConfigs'],
];

// 带参数的路由
$paramRoutes = [
    // 账号
    ['GET', '/api/v1/accounts/(\d+)', 'App\Controllers\AccountController', 'show'],
    ['PUT', '/api/v1/accounts/(\d+)', 'App\Controllers\AccountController', 'update'],
    ['DELETE', '/api/v1/accounts/(\d+)', 'App\Controllers\AccountController', 'destroy'],
    ['PUT', '/api/v1/account-groups/(\d+)', 'App\Controllers\AccountController', 'updateGroup'],
    ['DELETE', '/api/v1/account-groups/(\d+)', 'App\Controllers\AccountController', 'deleteGroup'],

    // 商品
    ['GET', '/api/v1/products/(\d+)', 'App\Controllers\ProductController', 'show'],
    ['PUT', '/api/v1/products/(\d+)', 'App\Controllers\ProductController', 'update'],
    ['DELETE', '/api/v1/products/(\d+)', 'App\Controllers\ProductController', 'destroy'],
    ['DELETE', '/api/v1/product-categories/(\d+)', 'App\Controllers\ProductController', 'deleteCategory'],

    // 订单
    ['GET', '/api/v1/orders/(\d+)', 'App\Controllers\OrderController', 'show'],
    ['PUT', '/api/v1/orders/(\d+)', 'App\Controllers\OrderController', 'update'],
    ['DELETE', '/api/v1/orders/(\d+)', 'App\Controllers\OrderController', 'destroy'],
    ['POST', '/api/v1/orders/(\d+)/ship', 'App\Controllers\OrderController', 'ship'],
    ['POST', '/api/v1/orders/(\d+)/refund', 'App\Controllers\OrderController', 'refund'],

    // 卡券
    ['GET', '/api/v1/coupons/(\d+)', 'App\Controllers\CouponController', 'show'],
    ['PUT', '/api/v1/coupons/(\d+)', 'App\Controllers\CouponController', 'update'],
    ['DELETE', '/api/v1/coupons/(\d+)', 'App\Controllers\CouponController', 'destroy'],
    ['DELETE', '/api/v1/coupon-categories/(\d+)', 'App\Controllers\CouponController', 'deleteCategory'],

    // 自动回复
    ['GET', '/api/v1/auto-replies/(\d+)', 'App\Controllers\ReplyController', 'autoReplyShow'],
    ['PUT', '/api/v1/auto-replies/(\d+)', 'App\Controllers\ReplyController', 'autoReplyUpdate'],
    ['DELETE', '/api/v1/auto-replies/(\d+)', 'App\Controllers\ReplyController', 'autoReplyDestroy'],

    // 指定回复
    ['GET', '/api/v1/targeted-replies/(\d+)', 'App\Controllers\ReplyController', 'targetedReplyShow'],
    ['PUT', '/api/v1/targeted-replies/(\d+)', 'App\Controllers\ReplyController', 'targetedReplyUpdate'],
    ['DELETE', '/api/v1/targeted-replies/(\d+)', 'App\Controllers\ReplyController', 'targetedReplyDestroy'],

    // 聊天
    ['GET', '/api/v1/chat/sessions/(\d+)/messages', 'App\Controllers\ChatController', 'messages'],
    ['POST', '/api/v1/chat/sessions/(\d+)/messages', 'App\Controllers\ChatController', 'sendMessage'],
    ['POST', '/api/v1/chat/sessions/(\d+)/archive', 'App\Controllers\ChatController', 'archiveSession'],

    // 通知
    ['POST', '/api/v1/notifications/(\d+)/read', 'App\Controllers\NotificationController', 'markAsRead'],
    ['DELETE', '/api/v1/notifications/(\d+)', 'App\Controllers\NotificationController', 'destroy'],

    // 配置
    ['GET', '/api/v1/configs/([a-z_]+)', 'App\Controllers\ConfigController', 'show'],
    ['PUT', '/api/v1/configs/([a-z_]+)', 'App\Controllers\ConfigController', 'update'],
];

try {
    // 首先尝试精确匹配
    $routeKey = "{$requestMethod} {$path}";
    if (isset($routes[$routeKey])) {
        [$controller, $method] = $routes[$routeKey];
        $controller::$method();
        exit;
    }

    // 尝试参数路由匹配
    foreach ($paramRoutes as [$method, $pattern, $controller, $action]) {
        if ($requestMethod === $method && preg_match("#^{$pattern}$#", $path, $matches)) {
            array_shift($matches); // 移除完整匹配
            $controller::$action(...$matches);
            exit;
        }
    }

    // 健康检查
    if ($path === '/health' || $path === '/api/health') {
        Response::success(['status' => 'ok', 'timestamp' => time()]);
    }

    // API文档入口
    if ($path === '' || $path === '/api' || $path === '/api/v1') {
        Response::success([
            'name' => '闲鱼管理系统 API',
            'version' => 'v1',
            'documentation' => '/api/v1/docs',
        ]);
    }

    // API 文档重定向到 Swagger UI
    if ($path === '/api/v1/docs') {
        header('Location: /docs/');
        exit;
    }

    // 404
    Response::notFound('接口不存在');

} catch (\PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    Response::serverError('数据库错误');
} catch (\Exception $e) {
    error_log("Error: " . $e->getMessage());
    Response::serverError($e->getMessage());
}
