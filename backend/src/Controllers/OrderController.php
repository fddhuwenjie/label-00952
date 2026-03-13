<?php
/**
 * 订单控制器
 * 
 * @package XianyuManager\Controllers
 */

namespace App\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Coupon;
use App\Models\Notification;
use App\Models\SystemConfig;
use App\Utils\Response;
use App\Utils\Validator;
use App\Utils\Database;
use App\Utils\Logger;
use App\Middleware\AuthMiddleware;

class OrderController
{
    /**
     * 获取订单列表
     * 
     * GET /api/v1/orders
     * 
     * @return void
     */
    public static function index(): void
    {
        $user = AuthMiddleware::authenticate();
        
        Logger::debug("获取订单列表", ['user_id' => $user['id'], 'params' => $_GET]);

        $page = (int) ($_GET['page'] ?? 1);
        $perPage = (int) ($_GET['per_page'] ?? 20);
        $filters = [
            'status' => $_GET['status'] ?? null,
            'account_id' => $_GET['account_id'] ?? null,
            'keyword' => $_GET['keyword'] ?? null,
            'start_date' => $_GET['start_date'] ?? null,
            'end_date' => $_GET['end_date'] ?? null,
        ];

        $result = Order::getWithRelations($page, $perPage, array_filter($filters));
        Response::paginate($result);
    }

    /**
     * 获取订单详情
     * 
     * GET /api/v1/orders/{id}
     * 
     * @param int $id 订单ID
     * @return void
     */
    public static function show(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        
        Logger::debug("获取订单详情", ['order_id' => $id, 'user_id' => $user['id']]);

        $order = Order::find($id);
        if (!$order) {
            Logger::warning("订单不存在", ['order_id' => $id]);
            Response::notFound('订单不存在');
        }

        // 获取关联信息
        if ($order['product_id']) {
            $order['product'] = Product::find($order['product_id']);
        }

        Response::success($order);
    }

    /**
     * 创建订单
     * 
     * POST /api/v1/orders
     * 
     * @return void
     */
    public static function store(): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireOperator($user);

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        
        Logger::info("创建订单请求", ['user_id' => $user['id'], 'product_id' => $data['product_id'] ?? null]);

        $validator = Validator::make($data)
            ->required('product_id', '商品ID不能为空')
            ->required('quantity', '数量不能为空')
            ->integer('quantity', '数量必须是整数');

        if ($validator->fails()) {
            Logger::warning("创建订单验证失败", ['error' => $validator->getFirstError()]);
            Response::error($validator->getFirstError());
        }

        $product = Product::find($data['product_id']);
        if (!$product) {
            Logger::warning("创建订单失败：商品不存在", ['product_id' => $data['product_id']]);
            Response::error('商品不存在');
        }

        $quantity = (int) $data['quantity'];
        $totalAmount = $product['price'] * $quantity;

        $id = Order::create([
            'order_no' => Order::generateOrderNo(),
            'xianyu_order_no' => $data['xianyu_order_no'] ?? null,
            'account_id' => $data['account_id'] ?? $product['account_id'],
            'product_id' => $product['id'],
            'buyer_name' => $data['buyer_name'] ?? null,
            'buyer_id' => $data['buyer_id'] ?? null,
            'quantity' => $quantity,
            'unit_price' => $product['price'],
            'total_amount' => $totalAmount,
            'status' => $data['status'] ?? 'pending',
            'remark' => $data['remark'] ?? null,
        ]);

        // 创建通知
        Notification::notify('order', '新订单', "订单号: " . Order::find($id)['order_no'], null, $id);

        Logger::info("订单创建成功", ['order_id' => $id, 'total_amount' => $totalAmount]);
        Response::success(['id' => $id], '订单创建成功');
    }

    /**
     * 更新订单状态
     * 
     * PUT /api/v1/orders/{id}
     * 
     * @param int $id 订单ID
     * @return void
     */
    public static function update(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireOperator($user);

        Logger::info("更新订单请求", ['order_id' => $id, 'user_id' => $user['id']]);

        $order = Order::find($id);
        if (!$order) {
            Logger::warning("更新订单失败：订单不存在", ['order_id' => $id]);
            Response::notFound('订单不存在');
        }

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $updateData = [];

        $shouldAutoDeliver = false;
        
        if (isset($data['status'])) {
            $updateData['status'] = $data['status'];
            Logger::info("订单状态变更", ['order_id' => $id, 'old_status' => $order['status'], 'new_status' => $data['status']]);
            
            // 状态变更时间
            switch ($data['status']) {
                case 'paid':
                    $updateData['paid_at'] = date('Y-m-d H:i:s');
                    // 检查是否需要自动发货
                    $shouldAutoDeliver = self::checkAutoDelivery($order);
                    break;
                case 'shipped':
                    $updateData['shipped_at'] = date('Y-m-d H:i:s');
                    break;
                case 'completed':
                    $updateData['completed_at'] = date('Y-m-d H:i:s');
                    break;
            }
        }

        if (isset($data['shipped_content'])) {
            $updateData['shipped_content'] = $data['shipped_content'];
        }

        if (isset($data['remark'])) {
            $updateData['remark'] = $data['remark'];
        }

        if (!empty($updateData)) {
            Order::update($id, $updateData);
        }

        // 自动发货
        if ($shouldAutoDeliver) {
            self::processAutoDelivery($id, $order);
        }

        Logger::info("订单更新成功", ['order_id' => $id]);
        Response::success(null, '订单更新成功');
    }

    /**
     * 检查是否需要自动发货
     * 
     * @param array $order 订单信息
     * @return bool
     */
    private static function checkAutoDelivery(array $order): bool
    {
        // 检查系统配置
        $systemEnabled = SystemConfig::get('auto_delivery_enabled', '0') === '1';
        if (!$systemEnabled) {
            Logger::debug("自动发货：系统开关关闭", ['order_id' => $order['id']]);
            return false;
        }

        // 检查商品配置
        if (!$order['product_id']) {
            return false;
        }

        $product = Product::find($order['product_id']);
        if (!$product || $product['auto_delivery'] != 1) {
            Logger::debug("自动发货：商品未开启", ['order_id' => $order['id'], 'product_id' => $order['product_id']]);
            return false;
        }

        Logger::info("自动发货：条件满足", ['order_id' => $order['id']]);
        return true;
    }

    /**
     * 执行自动发货
     * 
     * @param int $orderId 订单ID
     * @param array $order 订单信息
     * @return void
     */
    private static function processAutoDelivery(int $orderId, array $order): void
    {
        try {
            $coupons = Coupon::getAvailableForDelivery($order['product_id'], $order['quantity']);
            
            if (count($coupons) < $order['quantity']) {
                Logger::warning("自动发货失败：卡券库存不足", [
                    'order_id' => $orderId,
                    'required' => $order['quantity'],
                    'available' => count($coupons)
                ]);
                Notification::notify('stock', '自动发货失败', "订单 {$order['order_no']} 卡券库存不足", null, $orderId);
                return;
            }

            $contents = [];
            Database::beginTransaction();
            
            foreach ($coupons as $coupon) {
                Coupon::markAsUsed($coupon['id'], $orderId);
                $contents[] = $coupon['code'] . ($coupon['password'] ? ' / ' . $coupon['password'] : '');
            }
            
            Order::update($orderId, [
                'status' => 'shipped',
                'shipped_at' => date('Y-m-d H:i:s'),
                'shipped_content' => implode("\n", $contents),
            ]);
            
            Database::commit();
            
            Logger::info("自动发货成功", ['order_id' => $orderId, 'coupon_count' => count($coupons)]);
            Notification::notify('order', '自动发货成功', "订单 {$order['order_no']} 已自动发货", null, $orderId);
            
        } catch (\Exception $e) {
            Database::rollback();
            Logger::error("自动发货异常", ['order_id' => $orderId, 'error' => $e->getMessage()]);
        }
    }

    /**
     * 删除订单
     * 
     * DELETE /api/v1/orders/{id}
     * 
     * @param int $id 订单ID
     * @return void
     */
    public static function destroy(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireAdmin($user);

        Logger::info("删除订单请求", ['order_id' => $id, 'user_id' => $user['id']]);

        $order = Order::find($id);
        if (!$order) {
            Logger::warning("删除订单失败：订单不存在", ['order_id' => $id]);
            Response::notFound('订单不存在');
        }

        Order::delete($id);
        Logger::info("订单删除成功", ['order_id' => $id, 'order_no' => $order['order_no']]);
        Response::success(null, '订单删除成功');
    }

    /**
     * 获取订单统计
     * 
     * GET /api/v1/orders/stats
     * 
     * @return void
     */
    public static function stats(): void
    {
        AuthMiddleware::authenticate();
        
        $statusStats = Order::getStatusStats();
        $todayStats = Order::getTodayStats();

        Response::success([
            'status' => $statusStats,
            'today' => $todayStats,
        ]);
    }

    /**
     * 手动发货
     * 
     * POST /api/v1/orders/{id}/ship
     * 
     * @param int $id 订单ID
     * @return void
     */
    public static function ship(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireOperator($user);

        Logger::info("订单发货请求", ['order_id' => $id, 'user_id' => $user['id']]);

        $order = Order::find($id);
        if (!$order) {
            Logger::warning("发货失败：订单不存在", ['order_id' => $id]);
            Response::notFound('订单不存在');
        }

        if ($order['status'] !== 'paid') {
            Logger::warning("发货失败：订单状态不正确", ['order_id' => $id, 'status' => $order['status']]);
            Response::error('只有已支付的订单才能发货');
        }

        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        if (empty($data['content'])) {
            // 自动从卡券库获取
            $coupons = Coupon::getAvailableForDelivery($order['product_id'], $order['quantity']);
            
            if (count($coupons) < $order['quantity']) {
                Logger::warning("发货失败：卡券库存不足", ['order_id' => $id, 'required' => $order['quantity'], 'available' => count($coupons)]);
                Response::error('卡券库存不足');
            }

            $contents = [];
            Database::beginTransaction();
            try {
                foreach ($coupons as $coupon) {
                    Coupon::markAsUsed($coupon['id'], $order['id']);
                    $contents[] = $coupon['code'] . ($coupon['password'] ? ' / ' . $coupon['password'] : '');
                }
                Database::commit();
                Logger::info("自动发货卡券分配成功", ['order_id' => $id, 'coupon_count' => count($coupons)]);
            } catch (\Exception $e) {
                Database::rollback();
                Logger::error("发货失败：数据库错误", ['order_id' => $id, 'error' => $e->getMessage()]);
                Response::error('发货失败: ' . $e->getMessage());
            }

            $data['content'] = implode("\n", $contents);
        }

        Order::update($id, [
            'status' => 'shipped',
            'shipped_at' => date('Y-m-d H:i:s'),
            'shipped_content' => $data['content'],
        ]);

        Logger::info("订单发货成功", ['order_id' => $id, 'order_no' => $order['order_no']]);
        Response::success(['content' => $data['content']], '发货成功');
    }

    /**
     * 退款
     * 
     * POST /api/v1/orders/{id}/refund
     * 
     * @param int $id 订单ID
     * @return void
     */
    public static function refund(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireOperator($user);

        Logger::info("订单退款请求", ['order_id' => $id, 'user_id' => $user['id']]);

        $order = Order::find($id);
        if (!$order) {
            Logger::warning("退款失败：订单不存在", ['order_id' => $id]);
            Response::notFound('订单不存在');
        }

        Order::update($id, ['status' => 'refunded']);
        
        // 恢复卡券状态(如果已发货)
        if ($order['status'] === 'shipped') {
            Database::execute(
                "UPDATE coupons SET status = 'available', used_at = NULL, used_order_id = NULL WHERE used_order_id = ?",
                [$id]
            );
            Logger::info("退款：已恢复卡券状态", ['order_id' => $id]);
        }

        Logger::info("订单退款成功", ['order_id' => $id, 'order_no' => $order['order_no']]);
        Response::success(null, '退款成功');
    }
}
