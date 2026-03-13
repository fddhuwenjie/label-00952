<?php
/**
 * 消息通知模型
 * 
 * @package XianyuManager\Models
 */

namespace App\Models;

use App\Utils\Database;

class Notification extends BaseModel
{
    protected static string $table = 'notifications';

    /**
     * 创建通知
     * 
     * @param string $type 通知类型
     * @param string $title 标题
     * @param string|null $content 内容
     * @param int|null $userId 用户ID
     * @param int|null $relatedId 关联ID
     * @return int 通知ID
     */
    public static function notify(string $type, string $title, ?string $content = null, ?int $userId = null, ?int $relatedId = null): int
    {
        return self::create([
            'type' => $type,
            'title' => $title,
            'content' => $content,
            'user_id' => $userId,
            'related_id' => $relatedId,
        ]);
    }

    /**
     * 获取通知列表
     * 
     * @param int|null $userId 用户ID
     * @param int $page 页码
     * @param int $perPage 每页数量
     * @param array $filters 筛选条件
     * @return array
     */
    public static function getList(?int $userId = null, int $page = 1, int $perPage = 20, array $filters = []): array
    {
        $sql = "SELECT * FROM notifications";
        $params = [];
        $where = [];

        if ($userId !== null) {
            $where[] = "(user_id = ? OR user_id IS NULL)";
            $params[] = $userId;
        }

        if (!empty($filters['type'])) {
            $where[] = "type = ?";
            $params[] = $filters['type'];
        }

        if (isset($filters['is_read'])) {
            $where[] = "is_read = ?";
            $params[] = $filters['is_read'];
        }

        if (!empty($where)) {
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        $sql .= " ORDER BY id DESC";

        return Database::paginate($sql, $params, $page, $perPage);
    }

    /**
     * 标记为已读
     * 
     * @param int $notificationId 通知ID
     * @return void
     */
    public static function markAsRead(int $notificationId): void
    {
        self::update($notificationId, ['is_read' => 1]);
    }

    /**
     * 标记所有为已读
     * 
     * @param int|null $userId 用户ID
     * @return int 影响行数
     */
    public static function markAllAsRead(?int $userId = null): int
    {
        $sql = "UPDATE notifications SET is_read = 1 WHERE is_read = 0";
        $params = [];

        if ($userId !== null) {
            $sql .= " AND (user_id = ? OR user_id IS NULL)";
            $params[] = $userId;
        }

        return Database::execute($sql, $params);
    }

    /**
     * 获取未读数量
     * 
     * @param int|null $userId 用户ID
     * @return int
     */
    public static function getUnreadCount(?int $userId = null): int
    {
        $sql = "SELECT COUNT(*) as count FROM notifications WHERE is_read = 0";
        $params = [];

        if ($userId !== null) {
            $sql .= " AND (user_id = ? OR user_id IS NULL)";
            $params[] = $userId;
        }

        $result = Database::fetchOne($sql, $params);
        return (int) ($result['count'] ?? 0);
    }
}
