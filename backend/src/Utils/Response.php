<?php
/**
 * HTTP响应工具类
 * 
 * 提供统一的JSON响应格式
 * 
 * @package XianyuManager\Utils
 */

namespace App\Utils;

class Response
{
    /**
     * 成功响应
     * 
     * @param mixed $data 响应数据
     * @param string $message 消息
     * @param int $code HTTP状态码
     * @return void
     */
    public static function success($data = null, string $message = 'success', int $code = 200): void
    {
        self::json([
            'code' => 0,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    /**
     * 错误响应
     * 
     * @param string $message 错误消息
     * @param int $errorCode 业务错误码
     * @param int $httpCode HTTP状态码
     * @param mixed $data 附加数据
     * @return void
     */
    public static function error(string $message, int $errorCode = 1, int $httpCode = 400, $data = null): void
    {
        self::json([
            'code' => $errorCode,
            'message' => $message,
            'data' => $data,
        ], $httpCode);
    }

    /**
     * 分页响应
     * 
     * @param array $paginateData 分页数据
     * @param string $message 消息
     * @return void
     */
    public static function paginate(array $paginateData, string $message = 'success'): void
    {
        self::json([
            'code' => 0,
            'message' => $message,
            'data' => $paginateData['data'],
            'pagination' => [
                'total' => $paginateData['total'],
                'page' => $paginateData['page'],
                'per_page' => $paginateData['per_page'],
                'total_pages' => $paginateData['total_pages'],
            ],
        ]);
    }

    /**
     * 输出JSON
     * 
     * @param array $data 数据
     * @param int $code HTTP状态码
     * @return void
     */
    public static function json(array $data, int $code = 200): void
    {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * 未授权
     * 
     * @param string $message 消息
     * @return void
     */
    public static function unauthorized(string $message = '未授权,请先登录'): void
    {
        self::error($message, 401, 401);
    }

    /**
     * 禁止访问
     * 
     * @param string $message 消息
     * @return void
     */
    public static function forbidden(string $message = '没有权限执行此操作'): void
    {
        self::error($message, 403, 403);
    }

    /**
     * 资源不存在
     * 
     * @param string $message 消息
     * @return void
     */
    public static function notFound(string $message = '资源不存在'): void
    {
        self::error($message, 404, 404);
    }

    /**
     * 服务器错误
     * 
     * @param string $message 消息
     * @return void
     */
    public static function serverError(string $message = '服务器内部错误'): void
    {
        self::error($message, 500, 500);
    }
}
