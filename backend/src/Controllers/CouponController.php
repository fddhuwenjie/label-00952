<?php
/**
 * 卡券控制器
 * 
 * @package XianyuManager\Controllers
 */

namespace App\Controllers;

use App\Models\Coupon;
use App\Models\CouponCategory;
use App\Utils\Response;
use App\Utils\Validator;
use App\Utils\Logger;
use App\Middleware\AuthMiddleware;

class CouponController
{
    /**
     * 获取卡券列表
     * 
     * GET /api/v1/coupons
     * 
     * @return void
     */
    public static function index(): void
    {
        $user = AuthMiddleware::authenticate();
        
        Logger::debug("获取卡券列表", ['user_id' => $user['id'], 'params' => $_GET]);

        $page = (int) ($_GET['page'] ?? 1);
        $perPage = (int) ($_GET['per_page'] ?? 20);
        $filters = [
            'status' => $_GET['status'] ?? null,
            'category_id' => $_GET['category_id'] ?? null,
            'product_id' => $_GET['product_id'] ?? null,
            'keyword' => $_GET['keyword'] ?? null,
        ];

        $result = Coupon::getWithCategory($page, $perPage, array_filter($filters));
        Response::paginate($result);
    }

    /**
     * 获取卡券详情
     * 
     * GET /api/v1/coupons/{id}
     * 
     * @param int $id 卡券ID
     * @return void
     */
    public static function show(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        
        Logger::debug("获取卡券详情", ['coupon_id' => $id, 'user_id' => $user['id']]);

        $coupon = Coupon::find($id);
        if (!$coupon) {
            Logger::warning("卡券不存在", ['coupon_id' => $id]);
            Response::notFound('卡券不存在');
        }

        Response::success($coupon);
    }

    /**
     * 创建卡券(单个)
     * 
     * POST /api/v1/coupons
     * 
     * @return void
     */
    public static function store(): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireOperator($user);

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        
        Logger::info("创建卡券请求", ['user_id' => $user['id']]);

        $validator = Validator::make($data)
            ->required('code', '卡券码不能为空');

        if ($validator->fails()) {
            Logger::warning("创建卡券验证失败", ['error' => $validator->getFirstError()]);
            Response::error($validator->getFirstError());
        }

        $id = Coupon::create([
            'category_id' => $data['category_id'] ?? null,
            'product_id' => $data['product_id'] ?? null,
            'code' => $data['code'],
            'password' => $data['password'] ?? null,
            'status' => 'available',
            'expire_at' => $data['expire_at'] ?? null,
        ]);

        Logger::info("卡券创建成功", ['coupon_id' => $id]);
        Response::success(['id' => $id], '卡券创建成功');
    }

    /**
     * 批量导入卡券
     * 
     * POST /api/v1/coupons/batch
     * 
     * @return void
     */
    public static function batchImport(): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireOperator($user);

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        
        Logger::info("批量导入卡券请求", ['user_id' => $user['id'], 'count' => count($data['coupons'] ?? [])]);

        if (empty($data['coupons']) || !is_array($data['coupons'])) {
            Logger::warning("批量导入失败：无卡券数据");
            Response::error('请提供卡券数据');
        }

        $categoryId = $data['category_id'] ?? null;
        $productId = $data['product_id'] ?? null;
        $expireAt = $data['expire_at'] ?? null;

        $rows = [];
        foreach ($data['coupons'] as $item) {
            if (is_string($item)) {
                // 简单格式: "code" 或 "code----password"
                $parts = explode('----', $item);
                $rows[] = [
                    'category_id' => $categoryId,
                    'product_id' => $productId,
                    'code' => trim($parts[0]),
                    'password' => isset($parts[1]) ? trim($parts[1]) : null,
                    'status' => 'available',
                    'expire_at' => $expireAt,
                ];
            } elseif (is_array($item)) {
                $rows[] = [
                    'category_id' => $item['category_id'] ?? $categoryId,
                    'product_id' => $item['product_id'] ?? $productId,
                    'code' => $item['code'],
                    'password' => $item['password'] ?? null,
                    'status' => 'available',
                    'expire_at' => $item['expire_at'] ?? $expireAt,
                ];
            }
        }

        if (empty($rows)) {
            Logger::warning("批量导入失败：无有效数据");
            Response::error('没有有效的卡券数据');
        }

        $count = Coupon::batchInsert($rows);
        Logger::info("批量导入卡券成功", ['count' => $count, 'product_id' => $productId]);
        Response::success(['count' => $count], "成功导入 {$count} 张卡券");
    }

    /**
     * 更新卡券
     * 
     * PUT /api/v1/coupons/{id}
     * 
     * @param int $id 卡券ID
     * @return void
     */
    public static function update(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireOperator($user);

        Logger::info("更新卡券请求", ['coupon_id' => $id, 'user_id' => $user['id']]);

        $coupon = Coupon::find($id);
        if (!$coupon) {
            Logger::warning("更新卡券失败：卡券不存在", ['coupon_id' => $id]);
            Response::notFound('卡券不存在');
        }

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $allowedFields = ['category_id', 'product_id', 'code', 'password', 'status', 'expire_at'];
        $updateData = [];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $updateData[$field] = $data[$field];
            }
        }

        if (!empty($updateData)) {
            Coupon::update($id, $updateData);
            Logger::info("卡券更新成功", ['coupon_id' => $id]);
        }

        Response::success(null, '卡券更新成功');
    }

    /**
     * 删除卡券
     * 
     * DELETE /api/v1/coupons/{id}
     * 
     * @param int $id 卡券ID
     * @return void
     */
    public static function destroy(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireAdmin($user);

        Logger::info("删除卡券请求", ['coupon_id' => $id, 'user_id' => $user['id']]);

        $coupon = Coupon::find($id);
        if (!$coupon) {
            Logger::warning("删除卡券失败：卡券不存在", ['coupon_id' => $id]);
            Response::notFound('卡券不存在');
        }

        Coupon::delete($id);
        Logger::info("卡券删除成功", ['coupon_id' => $id]);
        Response::success(null, '卡券删除成功');
    }

    /**
     * 获取卡券统计
     * 
     * GET /api/v1/coupons/stats
     * 
     * @return void
     */
    public static function stats(): void
    {
        AuthMiddleware::authenticate();
        $productId = isset($_GET['product_id']) ? (int) $_GET['product_id'] : null;
        $stats = Coupon::getStatusStats($productId);
        Response::success($stats);
    }

    /**
     * 获取卡券分类列表
     * 
     * GET /api/v1/coupon-categories
     * 
     * @return void
     */
    public static function categories(): void
    {
        AuthMiddleware::authenticate();
        $categories = CouponCategory::all();
        Response::success($categories);
    }

    /**
     * 创建卡券分类
     * 
     * POST /api/v1/coupon-categories
     * 
     * @return void
     */
    public static function createCategory(): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireOperator($user);

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        
        Logger::info("创建卡券分类", ['user_id' => $user['id'], 'name' => $data['name'] ?? null]);

        $validator = Validator::make($data)
            ->required('name', '分类名称不能为空');

        if ($validator->fails()) {
            Response::error($validator->getFirstError());
        }

        $id = CouponCategory::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
        ]);

        Logger::info("卡券分类创建成功", ['category_id' => $id]);
        Response::success(['id' => $id], '分类创建成功');
    }

    /**
     * 删除卡券分类
     * 
     * DELETE /api/v1/coupon-categories/{id}
     * 
     * @param int $id 分类ID
     * @return void
     */
    public static function deleteCategory(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireAdmin($user);

        Logger::info("删除卡券分类", ['category_id' => $id, 'user_id' => $user['id']]);
        CouponCategory::delete($id);
        Response::success(null, '分类删除成功');
    }
}
