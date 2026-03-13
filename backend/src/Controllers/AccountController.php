<?php
/**
 * 闲鱼账号控制器
 * 
 * @package XianyuManager\Controllers
 */

namespace App\Controllers;

use App\Models\XianyuAccount;
use App\Models\AccountGroup;
use App\Utils\Response;
use App\Utils\Validator;
use App\Utils\Logger;
use App\Middleware\AuthMiddleware;

class AccountController
{
    /**
     * 获取账号列表
     * 
     * GET /api/v1/accounts
     * 
     * @return void
     */
    public static function index(): void
    {
        $user = AuthMiddleware::authenticate();
        
        Logger::debug("获取账号列表", ['user_id' => $user['id'], 'params' => $_GET]);

        $page = (int) ($_GET['page'] ?? 1);
        $perPage = (int) ($_GET['per_page'] ?? 20);
        $filters = [
            'status' => $_GET['status'] ?? null,
            'group_id' => $_GET['group_id'] ?? null,
            'keyword' => $_GET['keyword'] ?? null,
        ];

        $result = XianyuAccount::getWithGroup($page, $perPage, array_filter($filters));
        Response::paginate($result);
    }

    /**
     * 获取账号详情
     * 
     * GET /api/v1/accounts/{id}
     * 
     * @param int $id 账号ID
     * @return void
     */
    public static function show(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        
        Logger::debug("获取账号详情", ['account_id' => $id, 'user_id' => $user['id']]);

        $account = XianyuAccount::find($id);
        if (!$account) {
            Logger::warning("账号不存在", ['account_id' => $id]);
            Response::notFound('账号不存在');
        }

        Response::success($account);
    }

    /**
     * 创建账号
     * 
     * POST /api/v1/accounts
     * 
     * @return void
     */
    public static function store(): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireOperator($user);

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        
        Logger::info("创建账号请求", ['user_id' => $user['id'], 'name' => $data['name'] ?? null]);

        $validator = Validator::make($data)
            ->required('name', '账号名称不能为空');

        if ($validator->fails()) {
            Logger::warning("创建账号验证失败", ['error' => $validator->getFirstError()]);
            Response::error($validator->getFirstError());
        }

        $id = XianyuAccount::create([
            'name' => $data['name'],
            'xianyu_id' => $data['xianyu_id'] ?? null,
            'cookie' => $data['cookie'] ?? null,
            'token' => $data['token'] ?? null,
            'group_id' => $data['group_id'] ?? null,
            'status' => $data['status'] ?? 'offline',
            'remark' => $data['remark'] ?? null,
        ]);

        Logger::info("账号创建成功", ['account_id' => $id, 'name' => $data['name']]);
        Response::success(['id' => $id], '账号创建成功');
    }

    /**
     * 更新账号
     * 
     * PUT /api/v1/accounts/{id}
     * 
     * @param int $id 账号ID
     * @return void
     */
    public static function update(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireOperator($user);

        Logger::info("更新账号请求", ['account_id' => $id, 'user_id' => $user['id']]);

        $account = XianyuAccount::find($id);
        if (!$account) {
            Logger::warning("更新账号失败：账号不存在", ['account_id' => $id]);
            Response::notFound('账号不存在');
        }

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $allowedFields = ['name', 'xianyu_id', 'cookie', 'token', 'group_id', 'status', 'remark'];
        $updateData = [];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $updateData[$field] = $data[$field];
            }
        }

        if (!empty($updateData)) {
            // 记录状态变更
            if (isset($updateData['status']) && $updateData['status'] !== $account['status']) {
                Logger::info("账号状态变更", ['account_id' => $id, 'old_status' => $account['status'], 'new_status' => $updateData['status']]);
            }
            XianyuAccount::update($id, $updateData);
            Logger::info("账号更新成功", ['account_id' => $id, 'updated_fields' => array_keys($updateData)]);
        }

        Response::success(null, '账号更新成功');
    }

    /**
     * 删除账号
     * 
     * DELETE /api/v1/accounts/{id}
     * 
     * @param int $id 账号ID
     * @return void
     */
    public static function destroy(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireAdmin($user);

        Logger::info("删除账号请求", ['account_id' => $id, 'user_id' => $user['id']]);

        $account = XianyuAccount::find($id);
        if (!$account) {
            Logger::warning("删除账号失败：账号不存在", ['account_id' => $id]);
            Response::notFound('账号不存在');
        }

        XianyuAccount::delete($id);
        Logger::info("账号删除成功", ['account_id' => $id, 'name' => $account['name']]);
        Response::success(null, '账号删除成功');
    }

    /**
     * 获取账号统计
     * 
     * GET /api/v1/accounts/stats
     * 
     * @return void
     */
    public static function stats(): void
    {
        AuthMiddleware::authenticate();
        $stats = XianyuAccount::getStatusStats();
        Response::success($stats);
    }

    /**
     * 获取账号分组列表
     * 
     * GET /api/v1/account-groups
     * 
     * @return void
     */
    public static function groups(): void
    {
        AuthMiddleware::authenticate();
        $groups = AccountGroup::all([], 'sort ASC, id ASC');
        Response::success($groups);
    }

    /**
     * 创建账号分组
     * 
     * POST /api/v1/account-groups
     * 
     * @return void
     */
    public static function createGroup(): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireOperator($user);

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        
        Logger::info("创建账号分组", ['user_id' => $user['id'], 'name' => $data['name'] ?? null]);

        $validator = Validator::make($data)
            ->required('name', '分组名称不能为空');

        if ($validator->fails()) {
            Response::error($validator->getFirstError());
        }

        $id = AccountGroup::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'sort' => $data['sort'] ?? 0,
        ]);

        Logger::info("账号分组创建成功", ['group_id' => $id]);
        Response::success(['id' => $id], '分组创建成功');
    }

    /**
     * 更新账号分组
     * 
     * PUT /api/v1/account-groups/{id}
     * 
     * @param int $id 分组ID
     * @return void
     */
    public static function updateGroup(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireOperator($user);

        Logger::info("更新账号分组", ['group_id' => $id, 'user_id' => $user['id']]);

        $group = AccountGroup::find($id);
        if (!$group) {
            Logger::warning("更新分组失败：分组不存在", ['group_id' => $id]);
            Response::notFound('分组不存在');
        }

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $allowedFields = ['name', 'description', 'sort'];
        $updateData = [];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $updateData[$field] = $data[$field];
            }
        }

        if (!empty($updateData)) {
            AccountGroup::update($id, $updateData);
        }

        Response::success(null, '分组更新成功');
    }

    /**
     * 删除账号分组
     * 
     * DELETE /api/v1/account-groups/{id}
     * 
     * @param int $id 分组ID
     * @return void
     */
    public static function deleteGroup(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireAdmin($user);

        Logger::info("删除账号分组", ['group_id' => $id, 'user_id' => $user['id']]);

        AccountGroup::delete($id);
        // 清除账号的分组关联
        XianyuAccount::update($id, ['group_id' => null]);

        Response::success(null, '分组删除成功');
    }
}
