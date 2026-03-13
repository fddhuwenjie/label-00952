<?php
/**
 * 数据验证工具类
 * 
 * 提供常用的数据验证方法
 * 
 * @package XianyuManager\Utils
 */

namespace App\Utils;

class Validator
{
    /** @var array 错误信息 */
    private array $errors = [];

    /** @var array 待验证数据 */
    private array $data = [];

    /**
     * 创建验证器实例
     * 
     * @param array $data 待验证数据
     * @return self
     */
    public static function make(array $data): self
    {
        $instance = new self();
        $instance->data = $data;
        return $instance;
    }

    /**
     * 必填验证
     * 
     * @param string $field 字段名
     * @param string $message 错误消息
     * @return self
     */
    public function required(string $field, string $message = ''): self
    {
        if (!isset($this->data[$field]) || $this->data[$field] === '' || $this->data[$field] === null) {
            $this->errors[$field] = $message ?: "{$field}不能为空";
        }
        return $this;
    }

    /**
     * 邮箱验证
     * 
     * @param string $field 字段名
     * @param string $message 错误消息
     * @return self
     */
    public function email(string $field, string $message = ''): self
    {
        if (isset($this->data[$field]) && $this->data[$field] !== '') {
            if (!filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
                $this->errors[$field] = $message ?: "邮箱格式不正确";
            }
        }
        return $this;
    }

    /**
     * 最小长度验证
     * 
     * @param string $field 字段名
     * @param int $length 最小长度
     * @param string $message 错误消息
     * @return self
     */
    public function minLength(string $field, int $length, string $message = ''): self
    {
        if (isset($this->data[$field]) && mb_strlen($this->data[$field]) < $length) {
            $this->errors[$field] = $message ?: "{$field}长度不能小于{$length}";
        }
        return $this;
    }

    /**
     * 最大长度验证
     * 
     * @param string $field 字段名
     * @param int $length 最大长度
     * @param string $message 错误消息
     * @return self
     */
    public function maxLength(string $field, int $length, string $message = ''): self
    {
        if (isset($this->data[$field]) && mb_strlen($this->data[$field]) > $length) {
            $this->errors[$field] = $message ?: "{$field}长度不能超过{$length}";
        }
        return $this;
    }

    /**
     * 数字验证
     * 
     * @param string $field 字段名
     * @param string $message 错误消息
     * @return self
     */
    public function numeric(string $field, string $message = ''): self
    {
        if (isset($this->data[$field]) && !is_numeric($this->data[$field])) {
            $this->errors[$field] = $message ?: "{$field}必须是数字";
        }
        return $this;
    }

    /**
     * 整数验证
     * 
     * @param string $field 字段名
     * @param string $message 错误消息
     * @return self
     */
    public function integer(string $field, string $message = ''): self
    {
        if (isset($this->data[$field]) && !filter_var($this->data[$field], FILTER_VALIDATE_INT)) {
            $this->errors[$field] = $message ?: "{$field}必须是整数";
        }
        return $this;
    }

    /**
     * 枚举值验证
     * 
     * @param string $field 字段名
     * @param array $values 允许的值
     * @param string $message 错误消息
     * @return self
     */
    public function in(string $field, array $values, string $message = ''): self
    {
        if (isset($this->data[$field]) && !in_array($this->data[$field], $values, true)) {
            $this->errors[$field] = $message ?: "{$field}的值不在允许范围内";
        }
        return $this;
    }

    /**
     * 检查是否验证通过
     * 
     * @return bool
     */
    public function passes(): bool
    {
        return empty($this->errors);
    }

    /**
     * 检查是否验证失败
     * 
     * @return bool
     */
    public function fails(): bool
    {
        return !empty($this->errors);
    }

    /**
     * 获取错误信息
     * 
     * @return array
     */
    public function getErrors(): array
    {
        return $this->errors;
    }

    /**
     * 获取第一个错误信息
     * 
     * @return string|null
     */
    public function getFirstError(): ?string
    {
        return !empty($this->errors) ? reset($this->errors) : null;
    }
}
