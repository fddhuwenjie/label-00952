<?php
/**
 * 聊天控制器
 * 
 * @package XianyuManager\Controllers
 */

namespace App\Controllers;

use App\Models\ChatSession;
use App\Models\ChatMessage;
use App\Models\AutoReply;
use App\Models\TargetedReply;
use App\Utils\Response;
use App\Utils\Validator;
use App\Utils\Logger;
use App\Middleware\AuthMiddleware;

class ChatController
{
    /**
     * 获取会话列表
     * 
     * GET /api/v1/chat/sessions
     * 
     * @return void
     */
    public static function sessions(): void
    {
        AuthMiddleware::authenticate();

        $page = (int) ($_GET['page'] ?? 1);
        $perPage = (int) ($_GET['per_page'] ?? 20);
        $filters = [
            'account_id' => $_GET['account_id'] ?? null,
            'status' => $_GET['status'] ?? null,
            'has_unread' => isset($_GET['has_unread']) ? (bool) $_GET['has_unread'] : null,
            'keyword' => $_GET['keyword'] ?? null,
        ];

        $result = ChatSession::getWithAccount($page, $perPage, array_filter($filters, fn($v) => $v !== null));
        Response::paginate($result);
    }

    /**
     * 获取会话消息列表
     * 
     * GET /api/v1/chat/sessions/{sessionId}/messages
     * 
     * @param int $sessionId 会话ID
     * @return void
     */
    public static function messages(int $sessionId): void
    {
        $user = AuthMiddleware::authenticate();

        Logger::info("获取会话消息", ['session_id' => $sessionId, 'user_id' => $user['id']]);

        $session = ChatSession::find($sessionId);
        if (!$session) {
            Logger::warning("会话不存在", ['session_id' => $sessionId]);
            Response::notFound('会话不存在');
        }

        $page = (int) ($_GET['page'] ?? 1);
        $perPage = (int) ($_GET['per_page'] ?? 50);

        $result = ChatMessage::getBySession($sessionId, $page, $perPage);
        
        // 标记为已读
        $unreadBefore = $session['unread_count'] ?? 0;
        ChatMessage::markAsRead($sessionId);
        ChatSession::clearUnread($sessionId);
        
        if ($unreadBefore > 0) {
            Logger::info("标记消息已读", ['session_id' => $sessionId, 'cleared_count' => $unreadBefore]);
        }

        Response::paginate($result);
    }

    /**
     * 发送消息
     * 
     * POST /api/v1/chat/sessions/{sessionId}/messages
     * 
     * @param int $sessionId 会话ID
     * @return void
     */
    public static function sendMessage(int $sessionId): void
    {
        $user = AuthMiddleware::authenticate();

        Logger::info("发送消息", ['session_id' => $sessionId, 'user_id' => $user['id']]);

        $session = ChatSession::find($sessionId);
        if (!$session) {
            Logger::warning("发送消息失败：会话不存在", ['session_id' => $sessionId]);
            Response::notFound('会话不存在');
        }

        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        $validator = Validator::make($data)
            ->required('content', '消息内容不能为空');

        if ($validator->fails()) {
            Logger::warning("发送消息失败：验证错误", ['error' => $validator->getFirstError()]);
            Response::error($validator->getFirstError());
        }

        $messageId = ChatMessage::send(
            $sessionId,
            'seller',
            $data['content'],
            $data['content_type'] ?? 'text'
        );

        ChatSession::updateLastMessage($sessionId, $data['content']);

        Logger::info("消息发送成功", ['session_id' => $sessionId, 'message_id' => $messageId]);
        Response::success(['id' => $messageId], '消息发送成功');
    }

    /**
     * 接收消息(买家发送)
     * 
     * POST /api/v1/chat/receive
     * 
     * @return void
     */
    public static function receiveMessage(): void
    {
        // API认证(支持外部程序调用)
        $user = AuthMiddleware::authenticateApiKey();

        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        Logger::info("接收买家消息", [
            'account_id' => $data['account_id'] ?? null,
            'buyer_id' => $data['buyer_id'] ?? null,
        ]);

        $validator = Validator::make($data)
            ->required('account_id', '账号ID不能为空')
            ->required('buyer_id', '买家ID不能为空')
            ->required('content', '消息内容不能为空');

        if ($validator->fails()) {
            Logger::warning("接收消息失败：验证错误", ['error' => $validator->getFirstError()]);
            Response::error($validator->getFirstError());
        }

        // 获取或创建会话
        $session = ChatSession::getOrCreate(
            (int) $data['account_id'],
            $data['buyer_id'],
            [
                'name' => $data['buyer_name'] ?? null,
                'avatar' => $data['buyer_avatar'] ?? null,
            ]
        );

        // 保存买家消息
        $messageId = ChatMessage::send(
            $session['id'],
            'buyer',
            $data['content'],
            $data['content_type'] ?? 'text'
        );

        Logger::info("买家消息已保存", ['session_id' => $session['id'], 'message_id' => $messageId]);

        // 更新会话
        ChatSession::updateLastMessage($session['id'], $data['content'], true);

        // 检查是否需要自动回复
        $autoReply = null;
        
        // 先检查指定回复
        $targetedRule = TargetedReply::findMatchingRule('user', $data['buyer_id']);
        if ($targetedRule) {
            $autoReply = $targetedRule['reply_content'];
            Logger::debug("匹配到指定回复规则", ['rule_id' => $targetedRule['id']]);
        }

        // 再检查自动回复关键词
        if (!$autoReply) {
            $autoRule = AutoReply::findMatchingRule(
                $data['content'],
                (int) $data['account_id'],
                $data['product_id'] ?? null
            );
            if ($autoRule) {
                $autoReply = $autoRule['reply_content'];
                Logger::debug("匹配到关键词回复规则", ['rule_id' => $autoRule['id']]);
            }
        }

        $response = [
            'session_id' => $session['id'],
            'message_id' => $messageId,
            'auto_reply' => null,
        ];

        // 发送自动回复
        if ($autoReply) {
            $replyId = ChatMessage::send(
                $session['id'],
                'seller',
                $autoReply,
                'text',
                true
            );
            ChatSession::updateLastMessage($session['id'], $autoReply);
            
            $response['auto_reply'] = [
                'id' => $replyId,
                'content' => $autoReply,
            ];
            Logger::info("自动回复已发送", ['session_id' => $session['id'], 'reply_id' => $replyId]);
        }

        Response::success($response);
    }

    /**
     * 获取未读消息数
     * 
     * GET /api/v1/chat/unread
     * 
     * @return void
     */
    public static function unreadCount(): void
    {
        AuthMiddleware::authenticate();

        $total = ChatSession::getTotalUnread();
        Response::success(['count' => $total]);
    }

    /**
     * 获取快捷回复列表
     * 
     * GET /api/v1/chat/quick-replies
     * 
     * @return void
     */
    public static function quickReplies(): void
    {
        AuthMiddleware::authenticate();

        // 从自动回复规则中获取常用回复
        $rules = AutoReply::all(['status' => 1], 'priority DESC, id ASC');
        
        $quickReplies = array_map(function ($rule) {
            return [
                'id' => $rule['id'],
                'name' => $rule['name'],
                'content' => $rule['reply_content'],
            ];
        }, array_slice($rules, 0, 20));

        Response::success($quickReplies);
    }

    /**
     * 标记会话为已归档
     * 
     * POST /api/v1/chat/sessions/{sessionId}/archive
     * 
     * @param int $sessionId 会话ID
     * @return void
     */
    public static function archiveSession(int $sessionId): void
    {
        $user = AuthMiddleware::authenticate();

        $session = ChatSession::find($sessionId);
        if (!$session) {
            Response::notFound('会话不存在');
        }

        ChatSession::update($sessionId, ['status' => 'archived']);
        Response::success(null, '会话已归档');
    }
}
