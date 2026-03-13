<?php
/**
 * 聊天消息模型
 * 
 * @package XianyuManager\Models
 */

namespace App\Models;

use App\Utils\Database;

class ChatMessage extends BaseModel
{
    protected static string $table = 'chat_messages';

    /**
     * 获取会话的消息列表
     * 
     * @param int $sessionId 会话ID
     * @param int $page 页码
     * @param int $perPage 每页数量
     * @return array
     */
    public static function getBySession(int $sessionId, int $page = 1, int $perPage = 50): array
    {
        $sql = "SELECT * FROM chat_messages WHERE session_id = ? ORDER BY id DESC";
        return Database::paginate($sql, [$sessionId], $page, $perPage);
    }

    /**
     * 标记会话消息为已读
     * 
     * @param int $sessionId 会话ID
     * @return int 影响行数
     */
    public static function markAsRead(int $sessionId): int
    {
        $sql = "UPDATE chat_messages SET is_read = 1 WHERE session_id = ? AND is_read = 0";
        return Database::execute($sql, [$sessionId]);
    }

    /**
     * 发送消息
     * 
     * @param int $sessionId 会话ID
     * @param string $senderType 发送方类型
     * @param string $content 消息内容
     * @param string $contentType 内容类型
     * @param bool $isAutoReply 是否自动回复
     * @return int 消息ID
     */
    public static function send(int $sessionId, string $senderType, string $content, string $contentType = 'text', bool $isAutoReply = false): int
    {
        return self::create([
            'session_id' => $sessionId,
            'sender_type' => $senderType,
            'content_type' => $contentType,
            'content' => $content,
            'is_auto_reply' => $isAutoReply ? 1 : 0,
        ]);
    }
}
