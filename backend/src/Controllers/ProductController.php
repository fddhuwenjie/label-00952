<?php
/**
 * 商品控制器
 * 
 * @package XianyuManager\Controllers
 */

namespace App\Controllers;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Utils\Response;
use App\Utils\Validator;
use App\Utils\Logger;
use App\Middleware\AuthMiddleware;

class ProductController
{
    /**
     * 获取商品列表
     * 
     * GET /api/v1/products
     * 
     * @return void
     */
    public static function index(): void
    {
        $user = AuthMiddleware::authenticate();
        
        Logger::debug("获取商品列表", ['user_id' => $user['id'], 'params' => $_GET]);

        $page = (int) ($_GET['page'] ?? 1);
        $perPage = (int) ($_GET['per_page'] ?? 20);
        $filters = [
            'status' => $_GET['status'] ?? null,
            'category_id' => $_GET['category_id'] ?? null,
            'account_id' => $_GET['account_id'] ?? null,
            'keyword' => $_GET['keyword'] ?? null,
        ];

        $result = Product::getWithRelations($page, $perPage, array_filter($filters));
        
        // 解析图片JSON
        foreach ($result['data'] as &$product) {
            $product['images'] = json_decode($product['images'], true) ?: [];
        }

        Response::paginate($result);
    }

    /**
     * 获取商品详情
     * 
     * GET /api/v1/products/{id}
     * 
     * @param int $id 商品ID
     * @return void
     */
    public static function show(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        
        Logger::debug("获取商品详情", ['product_id' => $id, 'user_id' => $user['id']]);

        $product = Product::find($id);
        if (!$product) {
            Logger::warning("商品不存在", ['product_id' => $id]);
            Response::notFound('商品不存在');
        }

        $product['images'] = json_decode($product['images'], true) ?: [];
        Response::success($product);
    }

    /**
     * 创建商品
     * 
     * POST /api/v1/products
     * 
     * @return void
     */
    public static function store(): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireOperator($user);

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        
        Logger::info("创建商品请求", ['user_id' => $user['id'], 'title' => $data['title'] ?? null]);

        $validator = Validator::make($data)
            ->required('title', '商品标题不能为空')
            ->required('price', '商品价格不能为空')
            ->numeric('price', '价格必须是数字');

        if ($validator->fails()) {
            Logger::warning("创建商品验证失败", ['error' => $validator->getFirstError()]);
            Response::error($validator->getFirstError());
        }

        $id = Product::create([
            'account_id' => $data['account_id'] ?? null,
            'category_id' => $data['category_id'] ?? null,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'original_price' => $data['original_price'] ?? null,
            'images' => isset($data['images']) ? json_encode($data['images']) : null,
            'stock' => $data['stock'] ?? 0,
            'status' => $data['status'] ?? 'draft',
            'auto_delivery' => $data['auto_delivery'] ?? 0,
            'delivery_type' => $data['delivery_type'] ?? 'coupon',
        ]);

        Logger::info("商品创建成功", ['product_id' => $id, 'title' => $data['title']]);
        Response::success(['id' => $id], '商品创建成功');
    }

    /**
     * 更新商品
     * 
     * PUT /api/v1/products/{id}
     * 
     * @param int $id 商品ID
     * @return void
     */
    public static function update(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireOperator($user);

        Logger::info("更新商品请求", ['product_id' => $id, 'user_id' => $user['id']]);

        $product = Product::find($id);
        if (!$product) {
            Logger::warning("更新商品失败：商品不存在", ['product_id' => $id]);
            Response::notFound('商品不存在');
        }

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $allowedFields = ['account_id', 'category_id', 'title', 'description', 'price', 'original_price', 'stock', 'status', 'auto_delivery', 'delivery_type', 'xianyu_product_id'];
        $updateData = [];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $updateData[$field] = $data[$field];
            }
        }

        if (isset($data['images'])) {
            $updateData['images'] = json_encode($data['images']);
        }

        if (!empty($updateData)) {
            Product::update($id, $updateData);
            Logger::info("商品更新成功", ['product_id' => $id, 'updated_fields' => array_keys($updateData)]);
        }

        Response::success(null, '商品更新成功');
    }

    /**
     * 删除商品
     * 
     * DELETE /api/v1/products/{id}
     * 
     * @param int $id 商品ID
     * @return void
     */
    public static function destroy(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireAdmin($user);

        Logger::info("删除商品请求", ['product_id' => $id, 'user_id' => $user['id']]);

        $product = Product::find($id);
        if (!$product) {
            Logger::warning("删除商品失败：商品不存在", ['product_id' => $id]);
            Response::notFound('商品不存在');
        }

        Product::delete($id);
        Logger::info("商品删除成功", ['product_id' => $id, 'title' => $product['title']]);
        Response::success(null, '商品删除成功');
    }

    /**
     * 获取商品统计
     * 
     * GET /api/v1/products/stats
     * 
     * @return void
     */
    public static function stats(): void
    {
        AuthMiddleware::authenticate();
        $stats = Product::getStatusStats();
        Response::success($stats);
    }

    /**
     * 获取商品分类列表
     * 
     * GET /api/v1/product-categories
     * 
     * @return void
     */
    public static function categories(): void
    {
        AuthMiddleware::authenticate();
        $categories = ProductCategory::all([], 'sort ASC, id ASC');
        Response::success($categories);
    }

    /**
     * 创建商品分类
     * 
     * POST /api/v1/product-categories
     * 
     * @return void
     */
    public static function createCategory(): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireOperator($user);

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        
        Logger::info("创建商品分类", ['user_id' => $user['id'], 'name' => $data['name'] ?? null]);

        $validator = Validator::make($data)
            ->required('name', '分类名称不能为空');

        if ($validator->fails()) {
            Response::error($validator->getFirstError());
        }

        $id = ProductCategory::create([
            'name' => $data['name'],
            'parent_id' => $data['parent_id'] ?? 0,
            'sort' => $data['sort'] ?? 0,
        ]);

        Logger::info("商品分类创建成功", ['category_id' => $id]);
        Response::success(['id' => $id], '分类创建成功');
    }

    /**
     * 删除商品分类
     * 
     * DELETE /api/v1/product-categories/{id}
     * 
     * @param int $id 分类ID
     * @return void
     */
    public static function deleteCategory(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireAdmin($user);

        Logger::info("删除商品分类", ['category_id' => $id, 'user_id' => $user['id']]);
        ProductCategory::delete($id);
        Response::success(null, '分类删除成功');
    }
}
