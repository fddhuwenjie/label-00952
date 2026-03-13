<?php
/**
 * 回复规则控制器
 * 
 * @package XianyuManager\Controllers
 */

namespace App\Controllers;

use App\Models\AutoReply;
use App\Models\TargetedReply;
use App\Utils\Response;
use App\Utils\Validator;
use App\Utils\Logger;
use App\Middleware\AuthMiddleware;

class ReplyController
{
    // ========== 自动回复 ==========

    /**
     * 获取自动回复规则列表
     * 
     * GET /api/v1/auto-replies
     * 
     * @return void
     */
    public static function autoReplyIndex(): void
    {
        $user = AuthMiddleware::authenticate();
        
        Logger::debug("获取自动回复规则列表", ['user_id' => $user['id']]);

        $page = (int) ($_GET['page'] ?? 1);
        $perPage = (int) ($_GET['per_page'] ?? 20);
        $filters = [
            'status' => isset($_GET['status']) ? (int) $_GET['status'] : null,
            'keyword' => $_GET['keyword'] ?? null,
        ];

        $result = AutoReply::getWithRelations($page, $perPage, array_filter($filters, fn($v) => $v !== null));
        
        // 解析关键词JSON
        foreach ($result['data'] as &$rule) {
            $rule['keywords'] = json_decode($rule['keywords'], true) ?: [];
        }

        Response::paginate($result);
    }

    /**
     * 获取自动回复规则详情
     * 
     * GET /api/v1/auto-replies/{id}
     * 
     * @param int $id 规则ID
     * @return void
     */
    public static function autoReplyShow(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        
        Logger::debug("获取自动回复规则详情", ['rule_id' => $id, 'user_id' => $user['id']]);

        $rule = AutoReply::find($id);
        if (!$rule) {
            Logger::warning("自动回复规则不存在", ['rule_id' => $id]);
            Response::notFound('规则不存在');
        }

        $rule['keywords'] = json_decode($rule['keywords'], true) ?: [];
        Response::success($rule);
    }

    /**
     * 创建自动回复规则
     * 
     * POST /api/v1/auto-replies
     * 
     * @return void
     */
    public static function autoReplyStore(): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireOperator($user);

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        
        Logger::info("创建自动回复规则", ['user_id' => $user['id'], 'name' => $data['name'] ?? null]);

        $validator = Validator::make($data)
            ->required('name', '规则名称不能为空')
            ->required('keywords', '关键词不能为空')
            ->required('reply_content', '回复内容不能为空');

        if ($validator->fails()) {
            Logger::warning("创建自动回复规则验证失败", ['error' => $validator->getFirstError()]);
            Response::error($validator->getFirstError());
        }

        $id = AutoReply::create([
            'name' => $data['name'],
            'keywords' => json_encode($data['keywords']),
            'match_type' => $data['match_type'] ?? 'contains',
            'reply_content' => $data['reply_content'],
            'delay_seconds' => $data['delay_seconds'] ?? 0,
            'priority' => $data['priority'] ?? 0,
            'status' => $data['status'] ?? 1,
            'account_id' => $data['account_id'] ?? null,
            'product_id' => $data['product_id'] ?? null,
        ]);

        Logger::info("自动回复规则创建成功", ['rule_id' => $id, 'name' => $data['name']]);
        Response::success(['id' => $id], '规则创建成功');
    }

    /**
     * 更新自动回复规则
     * 
     * PUT /api/v1/auto-replies/{id}
     * 
     * @param int $id 规则ID
     * @return void
     */
    public static function autoReplyUpdate(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireOperator($user);

        Logger::info("更新自动回复规则", ['rule_id' => $id, 'user_id' => $user['id']]);

        $rule = AutoReply::find($id);
        if (!$rule) {
            Logger::warning("更新自动回复规则失败：规则不存在", ['rule_id' => $id]);
            Response::notFound('规则不存在');
        }

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $allowedFields = ['name', 'match_type', 'reply_content', 'delay_seconds', 'priority', 'status', 'account_id', 'product_id'];
        $updateData = [];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $updateData[$field] = $data[$field];
            }
        }

        if (isset($data['keywords'])) {
            $updateData['keywords'] = json_encode($data['keywords']);
        }

        if (!empty($updateData)) {
            AutoReply::update($id, $updateData);
            Logger::info("自动回复规则更新成功", ['rule_id' => $id]);
        }

        Response::success(null, '规则更新成功');
    }

    /**
     * 删除自动回复规则
     * 
     * DELETE /api/v1/auto-replies/{id}
     * 
     * @param int $id 规则ID
     * @return void
     */
    public static function autoReplyDestroy(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireAdmin($user);

        Logger::info("删除自动回复规则", ['rule_id' => $id, 'user_id' => $user['id']]);
        AutoReply::delete($id);
        Response::success(null, '规则删除成功');
    }

    // ========== 指定回复 ==========

    /**
     * 获取指定回复规则列表
     * 
     * GET /api/v1/targeted-replies
     * 
     * @return void
     */
    public static function targetedReplyIndex(): void
    {
        $user = AuthMiddleware::authenticate();
        
        Logger::debug("获取指定回复规则列表", ['user_id' => $user['id']]);

        $page = (int) ($_GET['page'] ?? 1);
        $perPage = (int) ($_GET['per_page'] ?? 20);
        $filters = [
            'status' => isset($_GET['status']) ? (int) $_GET['status'] : null,
            'target_type' => $_GET['target_type'] ?? null,
            'keyword' => $_GET['keyword'] ?? null,
        ];

        $result = TargetedReply::getList($page, $perPage, array_filter($filters, fn($v) => $v !== null));
        Response::paginate($result);
    }

    /**
     * 获取指定回复规则详情
     * 
     * GET /api/v1/targeted-replies/{id}
     * 
     * @param int $id 规则ID
     * @return void
     */
    public static function targetedReplyShow(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        
        Logger::debug("获取指定回复规则详情", ['rule_id' => $id, 'user_id' => $user['id']]);

        $rule = TargetedReply::find($id);
        if (!$rule) {
            Logger::warning("指定回复规则不存在", ['rule_id' => $id]);
            Response::notFound('规则不存在');
        }

        Response::success($rule);
    }

    /**
     * 创建指定回复规则
     * 
     * POST /api/v1/targeted-replies
     * 
     * @return void
     */
    public static function targetedReplyStore(): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireOperator($user);

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        
        Logger::info("创建指定回复规则", ['user_id' => $user['id'], 'name' => $data['name'] ?? null, 'target_type' => $data['target_type'] ?? null]);

        $validator = Validator::make($data)
            ->required('name', '规则名称不能为空')
            ->required('target_type', '目标类型不能为空')
            ->required('target_id', '目标ID不能为空')
            ->required('reply_content', '回复内容不能为空')
            ->in('target_type', ['user', 'product', 'account'], '目标类型无效');

        if ($validator->fails()) {
            Logger::warning("创建指定回复规则验证失败", ['error' => $validator->getFirstError()]);
            Response::error($validator->getFirstError());
        }

        $id = TargetedReply::create([
            'name' => $data['name'],
            'target_type' => $data['target_type'],
            'target_id' => $data['target_id'],
            'reply_content' => $data['reply_content'],
            'time_start' => $data['time_start'] ?? null,
            'time_end' => $data['time_end'] ?? null,
            'priority' => $data['priority'] ?? 0,
            'status' => $data['status'] ?? 1,
        ]);

        Logger::info("指定回复规则创建成功", ['rule_id' => $id, 'name' => $data['name']]);
        Response::success(['id' => $id], '规则创建成功');
    }

    /**
     * 更新指定回复规则
     * 
     * PUT /api/v1/targeted-replies/{id}
     * 
     * @param int $id 规则ID
     * @return void
     */
    public static function targetedReplyUpdate(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireOperator($user);

        Logger::info("更新指定回复规则", ['rule_id' => $id, 'user_id' => $user['id']]);

        $rule = TargetedReply::find($id);
        if (!$rule) {
            Logger::warning("更新指定回复规则失败：规则不存在", ['rule_id' => $id]);
            Response::notFound('规则不存在');
        }

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $allowedFields = ['name', 'target_type', 'target_id', 'reply_content', 'time_start', 'time_end', 'priority', 'status'];
        $updateData = [];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $updateData[$field] = $data[$field];
            }
        }

        if (!empty($updateData)) {
            TargetedReply::update($id, $updateData);
            Logger::info("指定回复规则更新成功", ['rule_id' => $id]);
        }

        Response::success(null, '规则更新成功');
    }

    /**
     * 删除指定回复规则
     * 
     * DELETE /api/v1/targeted-replies/{id}
     * 
     * @param int $id 规则ID
     * @return void
     */
    public static function targetedReplyDestroy(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireAdmin($user);

        Logger::info("删除指定回复规则", ['rule_id' => $id, 'user_id' => $user['id']]);
        TargetedReply::delete($id);
        Response::success(null, '规则删除成功');
    }
}
