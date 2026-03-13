<?php
/**
 * 通知控制器
 * 
 * @package XianyuManager\Controllers
 */

namespace App\Controllers;

use App\Models\Notification;
use App\Utils\Response;
use App\Middleware\AuthMiddleware;

class NotificationController
{
    /**
     * 获取通知列表
     * 
     * GET /api/v1/notifications
     * 
     * @return void
     */
    public static function index(): void
    {
        $user = AuthMiddleware::authenticate();

        $page = (int) ($_GET['page'] ?? 1);
        $perPage = (int) ($_GET['per_page'] ?? 20);
        $filters = [
            'type' => $_GET['type'] ?? null,
            'is_read' => isset($_GET['is_read']) ? (int) $_GET['is_read'] : null,
        ];

        $result = Notification::getList($user['id'], $page, $perPage, array_filter($filters, fn($v) => $v !== null));
        Response::paginate($result);
    }

    /**
     * 获取未读数量
     * 
     * GET /api/v1/notifications/unread-count
     * 
     * @return void
     */
    public static function unreadCount(): void
    {
        $user = AuthMiddleware::authenticate();
        $count = Notification::getUnreadCount($user['id']);
        Response::success(['count' => $count]);
    }

    /**
     * 标记为已读
     * 
     * POST /api/v1/notifications/{id}/read
     * 
     * @param int $id 通知ID
     * @return void
     */
    public static function markAsRead(int $id): void
    {
        AuthMiddleware::authenticate();

        $notification = Notification::find($id);
        if (!$notification) {
            Response::notFound('通知不存在');
        }

        Notification::markAsRead($id);
        Response::success(null, '已标记为已读');
    }

    /**
     * 标记所有为已读
     * 
     * POST /api/v1/notifications/read-all
     * 
     * @return void
     */
    public static function markAllAsRead(): void
    {
        $user = AuthMiddleware::authenticate();
        $count = Notification::markAllAsRead($user['id']);
        Response::success(['count' => $count], '已全部标记为已读');
    }

    /**
     * 删除通知
     * 
     * DELETE /api/v1/notifications/{id}
     * 
     * @param int $id 通知ID
     * @return void
     */
    public static function destroy(int $id): void
    {
        AuthMiddleware::authenticate();

        $notification = Notification::find($id);
        if (!$notification) {
            Response::notFound('通知不存在');
        }

        Notification::delete($id);
        Response::success(null, '通知已删除');
    }
}
