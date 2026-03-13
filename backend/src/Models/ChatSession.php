<?php
/**
 * 聊天会话模型
 * 
 * @package XianyuManager\Models
 */

namespace App\Models;

use App\Utils\Database;

class ChatSession extends BaseModel
{
    protected static string $table = 'chat_sessions';

    /**
     * 获取或创建会话
     * 
     * @param int $accountId 账号ID
     * @param string $buyerId 买家ID
     * @param array $buyerInfo 买家信息
     * @return array
     */
    public static function getOrCreate(int $accountId, string $buyerId, array $buyerInfo = []): array
    {
        $session = self::findBy(['account_id' => $accountId, 'buyer_id' => $buyerId]);
        
        if (!$session) {
            $id = self::create([
                'account_id' => $accountId,
                'buyer_id' => $buyerId,
                'buyer_name' => $buyerInfo['name'] ?? null,
                'buyer_avatar' => $buyerInfo['avatar'] ?? null,
            ]);
            $session = self::find($id);
        }

        return $session;
    }

    /**
     * 更新最后消息
     * 
     * @param int $sessionId 会话ID
     * @param string $message 消息内容
     * @param bool $incrementUnread 是否增加未读数
     * @return void
     */
    public static function updateLastMessage(int $sessionId, string $message, bool $incrementUnread = false): void
    {
        $sql = "UPDATE chat_sessions SET 
                last_message = ?, 
                last_message_at = NOW()";
        
        if ($incrementUnread) {
            $sql .= ", unread_count = unread_count + 1";
        }
        
        $sql .= " WHERE id = ?";
        
        Database::execute($sql, [$message, $sessionId]);
    }

    /**
     * 清除未读数
     * 
     * @param int $sessionId 会话ID
     * @return void
     */
    public static function clearUnread(int $sessionId): void
    {
        self::update($sessionId, ['unread_count' => 0]);
    }

    /**
     * 获取会话列表(带账号信息)
     * 
     * @param int $page 页码
     * @param int $perPage 每页数量
     * @param array $filters 筛选条件
     * @return array
     */
    public static function getWithAccount(int $page = 1, int $perPage = 20, array $filters = []): array
    {
        $sql = "SELECT s.*, a.name as account_name 
                FROM chat_sessions s 
                LEFT JOIN xianyu_accounts a ON s.account_id = a.id";
        
        $params = [];
        $where = [];

        if (!empty($filters['account_id'])) {
            $where[] = "s.account_id = ?";
            $params[] = $filters['account_id'];
        }

        if (!empty($filters['status'])) {
            $where[] = "s.status = ?";
            $params[] = $filters['status'];
        }

        if (isset($filters['has_unread']) && $filters['has_unread']) {
            $where[] = "s.unread_count > 0";
        }

        if (!empty($filters['keyword'])) {
            $where[] = "(s.buyer_name LIKE ? OR s.buyer_id LIKE ?)";
            $params[] = "%{$filters['keyword']}%";
            $params[] = "%{$filters['keyword']}%";
        }

        if (!empty($where)) {
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        $sql .= " ORDER BY s.last_message_at DESC";

        return Database::paginate($sql, $params, $page, $perPage);
    }

    /**
     * 获取总未读数
     * 
     * @return int
     */
    public static function getTotalUnread(): int
    {
        $sql = "SELECT COALESCE(SUM(unread_count), 0) as total FROM chat_sessions";
        $result = Database::fetchOne($sql);
        return (int) ($result['total'] ?? 0);
    }
}
