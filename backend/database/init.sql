-- ============================================
-- 闲鱼管理系统 - 数据库初始化脚本
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------
-- 用户表
-- -------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    `username` VARCHAR(50) NOT NULL COMMENT '用户名',
    `password` VARCHAR(255) NOT NULL COMMENT '密码(加密)',
    `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像',
    `role` ENUM('admin', 'operator', 'viewer') DEFAULT 'operator' COMMENT '角色',
    `status` TINYINT(1) DEFAULT 1 COMMENT '状态: 1启用 0禁用',
    `api_key` VARCHAR(64) DEFAULT NULL COMMENT 'API密钥',
    `api_secret` VARCHAR(64) DEFAULT NULL COMMENT 'API密钥',
    `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    UNIQUE KEY `uk_api_key` (`api_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 默认管理员账号: admin / admin123
-- API Key/Secret 为初始占位值，请登录后在系统设置中刷新
INSERT INTO `users` (`username`, `password`, `email`, `role`, `api_key`, `api_secret`) VALUES
('admin', '$2y$10$bYWsi6c2SKqC3LVK5Nhywe.TeuWb1d/NBvKsAT9oTDRXs6yl4Tb..', 'admin@example.com', 'admin', CONCAT('ak_', SUBSTRING(MD5(RAND()), 1, 24)), CONCAT('sk_', SUBSTRING(MD5(RAND()), 1, 32)));

-- -------------------------------------------
-- 账号分组表
-- -------------------------------------------
DROP TABLE IF EXISTS `account_groups`;
CREATE TABLE `account_groups` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '分组ID',
    `name` VARCHAR(50) NOT NULL COMMENT '分组名称',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
    `sort` INT DEFAULT 0 COMMENT '排序',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账号分组表';

-- 测试数据：账号分组
INSERT INTO `account_groups` (`name`, `description`, `sort`) VALUES
('数码店铺', '专营数码产品的店铺账号', 1),
('服装店铺', '专营服装的店铺账号', 2),
('日用百货', '日用百货类商品账号', 3);

-- -------------------------------------------
-- 闲鱼账号表
-- -------------------------------------------
DROP TABLE IF EXISTS `xianyu_accounts`;
CREATE TABLE `xianyu_accounts` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '账号ID',
    `name` VARCHAR(100) NOT NULL COMMENT '账号名称',
    `xianyu_id` VARCHAR(100) DEFAULT NULL COMMENT '闲鱼ID',
    `cookie` TEXT DEFAULT NULL COMMENT 'Cookie信息',
    `token` TEXT DEFAULT NULL COMMENT 'Token信息',
    `group_id` INT UNSIGNED DEFAULT NULL COMMENT '分组ID',
    `status` ENUM('online', 'offline', 'error') DEFAULT 'offline' COMMENT '状态',
    `last_active_at` DATETIME DEFAULT NULL COMMENT '最后活跃时间',
    `remark` VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_group_id` (`group_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='闲鱼账号表';

-- 测试数据：闲鱼账号
INSERT INTO `xianyu_accounts` (`name`, `xianyu_id`, `group_id`, `status`, `last_active_at`, `remark`) VALUES
('数码主号', 'xy_digi_001', 1, 'online', NOW(), '主力账号，月销量最高'),
('数码副号', 'xy_digi_002', 1, 'offline', DATE_SUB(NOW(), INTERVAL 2 HOUR), '备用账号'),
('服装主号', 'xy_cloth_001', 2, 'online', NOW(), '服装类主力账号'),
('百货测试号', 'xy_daily_001', 3, 'error', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Cookie已过期，需要更新');

-- -------------------------------------------
-- 商品分类表
-- -------------------------------------------
DROP TABLE IF EXISTS `product_categories`;
CREATE TABLE `product_categories` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '分类ID',
    `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
    `parent_id` INT UNSIGNED DEFAULT 0 COMMENT '父分类ID',
    `sort` INT DEFAULT 0 COMMENT '排序',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品分类表';

-- 测试数据：商品分类
INSERT INTO `product_categories` (`name`, `parent_id`, `sort`) VALUES
('数码产品', 0, 1),
('服装鞋帽', 0, 2),
('虚拟商品', 0, 3),
('手机配件', 1, 1),
('电脑配件', 1, 2);

-- -------------------------------------------
-- 商品表
-- -------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '商品ID',
    `account_id` INT UNSIGNED DEFAULT NULL COMMENT '关联账号ID',
    `category_id` INT UNSIGNED DEFAULT NULL COMMENT '分类ID',
    `title` VARCHAR(255) NOT NULL COMMENT '商品标题',
    `description` TEXT DEFAULT NULL COMMENT '商品描述',
    `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '价格',
    `original_price` DECIMAL(10,2) DEFAULT NULL COMMENT '原价',
    `images` JSON DEFAULT NULL COMMENT '商品图片',
    `stock` INT DEFAULT 0 COMMENT '库存',
    `sold_count` INT DEFAULT 0 COMMENT '已售数量',
    `status` ENUM('draft', 'online', 'offline', 'sold_out') DEFAULT 'draft' COMMENT '状态',
    `xianyu_product_id` VARCHAR(100) DEFAULT NULL COMMENT '闲鱼商品ID',
    `auto_delivery` TINYINT(1) DEFAULT 0 COMMENT '是否自动发货',
    `delivery_type` ENUM('coupon', 'text', 'file') DEFAULT 'coupon' COMMENT '发货类型',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_account_id` (`account_id`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

-- 测试数据：商品
INSERT INTO `products` (`account_id`, `category_id`, `title`, `description`, `price`, `original_price`, `stock`, `sold_count`, `status`, `auto_delivery`, `delivery_type`) VALUES
(1, 4, 'iPhone 15 手机壳 透明防摔', '适用于iPhone15全系列的透明手机壳，四角防摔设计', 19.90, 39.90, 100, 58, 'online', 0, 'coupon'),
(1, 5, '机械键盘 RGB背光 青轴', '104键全键无冲，RGB背光，青轴手感清脆', 89.00, 159.00, 50, 23, 'online', 0, 'coupon'),
(2, 1, 'Steam充值卡 50元', '国区Steam钱包充值卡，自动发货', 48.00, 50.00, 200, 156, 'online', 1, 'coupon'),
(3, 2, '春季新款卫衣 男女同款', '纯棉面料，舒适透气，多色可选', 79.00, 129.00, 30, 12, 'online', 0, 'text'),
(1, 4, '数据线 Type-C快充 1米', '5A快充，支持主流安卓手机', 9.90, 19.90, 500, 320, 'online', 0, 'coupon');

-- -------------------------------------------
-- 订单表
-- -------------------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '订单ID',
    `order_no` VARCHAR(64) NOT NULL COMMENT '订单号',
    `xianyu_order_no` VARCHAR(100) DEFAULT NULL COMMENT '闲鱼订单号',
    `account_id` INT UNSIGNED DEFAULT NULL COMMENT '账号ID',
    `product_id` INT UNSIGNED DEFAULT NULL COMMENT '商品ID',
    `buyer_name` VARCHAR(100) DEFAULT NULL COMMENT '买家名称',
    `buyer_id` VARCHAR(100) DEFAULT NULL COMMENT '买家ID',
    `quantity` INT DEFAULT 1 COMMENT '数量',
    `unit_price` DECIMAL(10,2) NOT NULL COMMENT '单价',
    `total_amount` DECIMAL(10,2) NOT NULL COMMENT '总金额',
    `status` ENUM('pending', 'paid', 'shipped', 'completed', 'refunded', 'cancelled') DEFAULT 'pending' COMMENT '状态',
    `shipped_at` DATETIME DEFAULT NULL COMMENT '发货时间',
    `shipped_content` TEXT DEFAULT NULL COMMENT '发货内容',
    `paid_at` DATETIME DEFAULT NULL COMMENT '支付时间',
    `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
    `remark` VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_order_no` (`order_no`),
    KEY `idx_account_id` (`account_id`),
    KEY `idx_product_id` (`product_id`),
    KEY `idx_status` (`status`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- 测试数据：订单
INSERT INTO `orders` (`order_no`, `xianyu_order_no`, `account_id`, `product_id`, `buyer_name`, `buyer_id`, `quantity`, `unit_price`, `total_amount`, `status`, `paid_at`, `shipped_at`, `completed_at`) VALUES
('ORD202601300001', 'XY1234567890001', 1, 1, '小明同学', 'buyer_001', 2, 19.90, 39.80, 'completed', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('ORD202601300002', 'XY1234567890002', 1, 2, '数码爱好者', 'buyer_002', 1, 89.00, 89.00, 'shipped', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NULL),
('ORD202601300003', 'XY1234567890003', 2, 3, '游戏玩家A', 'buyer_003', 1, 48.00, 48.00, 'completed', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
('ORD202601300004', 'XY1234567890004', 2, 3, '游戏玩家B', 'buyer_004', 2, 48.00, 96.00, 'paid', NOW(), NULL, NULL),
('ORD202601300005', 'XY1234567890005', 3, 4, '时尚达人', 'buyer_005', 1, 79.00, 79.00, 'pending', NULL, NULL, NULL);

-- -------------------------------------------
-- 卡券分类表
-- -------------------------------------------
DROP TABLE IF EXISTS `coupon_categories`;
CREATE TABLE `coupon_categories` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '分类ID',
    `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='卡券分类表';

-- 测试数据：卡券分类
INSERT INTO `coupon_categories` (`name`, `description`) VALUES
('Steam充值卡', 'Steam平台充值卡密'),
('视频会员', '各平台视频会员兑换码'),
('游戏点卡', '游戏充值点卡');

-- -------------------------------------------
-- 卡券表
-- -------------------------------------------
DROP TABLE IF EXISTS `coupons`;
CREATE TABLE `coupons` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '卡券ID',
    `category_id` INT UNSIGNED DEFAULT NULL COMMENT '分类ID',
    `product_id` INT UNSIGNED DEFAULT NULL COMMENT '关联商品ID',
    `code` VARCHAR(255) NOT NULL COMMENT '卡券码',
    `password` VARCHAR(255) DEFAULT NULL COMMENT '卡券密码',
    `status` ENUM('available', 'used', 'expired') DEFAULT 'available' COMMENT '状态',
    `used_at` DATETIME DEFAULT NULL COMMENT '使用时间',
    `used_order_id` INT UNSIGNED DEFAULT NULL COMMENT '使用订单ID',
    `expire_at` DATETIME DEFAULT NULL COMMENT '过期时间',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_product_id` (`product_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='卡券表';

-- 测试数据：卡券
INSERT INTO `coupons` (`category_id`, `product_id`, `code`, `password`, `status`, `expire_at`) VALUES
(1, 3, 'STEAM-XXXX-YYYY-ZZZZ-0001', NULL, 'available', DATE_ADD(NOW(), INTERVAL 30 DAY)),
(1, 3, 'STEAM-XXXX-YYYY-ZZZZ-0002', NULL, 'available', DATE_ADD(NOW(), INTERVAL 30 DAY)),
(1, 3, 'STEAM-XXXX-YYYY-ZZZZ-0003', NULL, 'used', DATE_ADD(NOW(), INTERVAL 30 DAY)),
(1, 3, 'STEAM-XXXX-YYYY-ZZZZ-0004', NULL, 'available', DATE_ADD(NOW(), INTERVAL 30 DAY)),
(1, 3, 'STEAM-XXXX-YYYY-ZZZZ-0005', NULL, 'available', DATE_ADD(NOW(), INTERVAL 30 DAY)),
(2, NULL, 'VIP-IQIYI-ABC123', 'pass123', 'available', DATE_ADD(NOW(), INTERVAL 7 DAY)),
(2, NULL, 'VIP-YOUKU-DEF456', 'pass456', 'available', DATE_ADD(NOW(), INTERVAL 7 DAY));

-- -------------------------------------------
-- 自动回复规则表
-- -------------------------------------------
DROP TABLE IF EXISTS `auto_replies`;
CREATE TABLE `auto_replies` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '规则ID',
    `name` VARCHAR(100) NOT NULL COMMENT '规则名称',
    `keywords` JSON DEFAULT NULL COMMENT '触发关键词(JSON数组)',
    `match_type` ENUM('exact', 'contains', 'regex') DEFAULT 'contains' COMMENT '匹配类型',
    `reply_content` TEXT NOT NULL COMMENT '回复内容',
    `delay_seconds` INT DEFAULT 0 COMMENT '延迟秒数',
    `priority` INT DEFAULT 0 COMMENT '优先级(越大越优先)',
    `status` TINYINT(1) DEFAULT 1 COMMENT '状态: 1启用 0禁用',
    `account_id` INT UNSIGNED DEFAULT NULL COMMENT '指定账号(NULL为全局)',
    `product_id` INT UNSIGNED DEFAULT NULL COMMENT '指定商品(NULL为全局)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_status` (`status`),
    KEY `idx_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='自动回复规则表';

-- 测试数据：自动回复规则
INSERT INTO `auto_replies` (`name`, `keywords`, `match_type`, `reply_content`, `delay_seconds`, `priority`, `status`) VALUES
('欢迎语', '["你好", "在吗", "hi", "您好"]', 'contains', '您好！感谢您的咨询，请问有什么可以帮您？', 2, 100, 1),
('价格咨询', '["多少钱", "价格", "怎么卖"]', 'contains', '您好，商品价格已标注在详情页，如有疑问请直接拍下哦~', 3, 90, 1),
('发货时间', '["什么时候发货", "几天到", "发货"]', 'contains', '您好，拍下后24小时内发货，一般2-3天到达哦~', 2, 80, 1),
('售后问题', '["退款", "退货", "换货"]', 'contains', '您好，如有售后问题请先联系客服说明情况，我们会第一时间为您处理~', 5, 70, 1);

-- -------------------------------------------
-- 指定回复表
-- -------------------------------------------
DROP TABLE IF EXISTS `targeted_replies`;
CREATE TABLE `targeted_replies` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
    `name` VARCHAR(100) NOT NULL COMMENT '规则名称',
    `target_type` ENUM('user', 'product', 'account') NOT NULL COMMENT '目标类型',
    `target_id` VARCHAR(100) NOT NULL COMMENT '目标ID',
    `reply_content` TEXT NOT NULL COMMENT '回复内容',
    `time_start` TIME DEFAULT NULL COMMENT '生效开始时间',
    `time_end` TIME DEFAULT NULL COMMENT '生效结束时间',
    `priority` INT DEFAULT 0 COMMENT '优先级',
    `status` TINYINT(1) DEFAULT 1 COMMENT '状态',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_target` (`target_type`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='指定回复表';

-- 测试数据：指定回复
INSERT INTO `targeted_replies` (`name`, `target_type`, `target_id`, `reply_content`, `time_start`, `time_end`, `priority`, `status`) VALUES
('VIP客户专属', 'user', 'buyer_001', '尊敬的VIP客户您好，有任何问题随时联系我~', NULL, NULL, 100, 1),
('Steam卡专属回复', 'product', '3', '您好，Steam充值卡拍下后自动发货，请注意查收卡密信息~', NULL, NULL, 90, 1);

-- -------------------------------------------
-- 聊天会话表
-- -------------------------------------------
DROP TABLE IF EXISTS `chat_sessions`;
CREATE TABLE `chat_sessions` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '会话ID',
    `account_id` INT UNSIGNED NOT NULL COMMENT '账号ID',
    `buyer_id` VARCHAR(100) NOT NULL COMMENT '买家ID',
    `buyer_name` VARCHAR(100) DEFAULT NULL COMMENT '买家名称',
    `buyer_avatar` VARCHAR(255) DEFAULT NULL COMMENT '买家头像',
    `last_message` TEXT DEFAULT NULL COMMENT '最后消息',
    `last_message_at` DATETIME DEFAULT NULL COMMENT '最后消息时间',
    `unread_count` INT DEFAULT 0 COMMENT '未读数量',
    `status` ENUM('active', 'archived') DEFAULT 'active' COMMENT '状态',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_account_buyer` (`account_id`, `buyer_id`),
    KEY `idx_last_message_at` (`last_message_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天会话表';

-- 测试数据：聊天会话
INSERT INTO `chat_sessions` (`account_id`, `buyer_id`, `buyer_name`, `last_message`, `last_message_at`, `unread_count`) VALUES
(1, 'buyer_001', '小明同学', '好的，谢谢老板！', DATE_SUB(NOW(), INTERVAL 30 MINUTE), 0),
(1, 'buyer_002', '数码爱好者', '请问这个键盘是机械的吗？', NOW(), 1),
(2, 'buyer_003', '游戏玩家A', '卡密收到了，非常感谢！', DATE_SUB(NOW(), INTERVAL 2 HOUR), 0);

-- -------------------------------------------
-- 聊天消息表
-- -------------------------------------------
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '消息ID',
    `session_id` INT UNSIGNED NOT NULL COMMENT '会话ID',
    `sender_type` ENUM('seller', 'buyer', 'system') NOT NULL COMMENT '发送方类型',
    `content_type` ENUM('text', 'image', 'product', 'order') DEFAULT 'text' COMMENT '内容类型',
    `content` TEXT NOT NULL COMMENT '消息内容',
    `is_read` TINYINT(1) DEFAULT 0 COMMENT '是否已读',
    `is_auto_reply` TINYINT(1) DEFAULT 0 COMMENT '是否自动回复',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_session_id` (`session_id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天消息表';

-- 测试数据：聊天消息
INSERT INTO `chat_messages` (`session_id`, `sender_type`, `content_type`, `content`, `is_read`, `is_auto_reply`) VALUES
(1, 'buyer', 'text', '你好，手机壳有现货吗？', 1, 0),
(1, 'seller', 'text', '您好！有的，放心购买~', 1, 1),
(1, 'buyer', 'text', '好的，谢谢老板！', 1, 0),
(2, 'buyer', 'text', '请问这个键盘是机械的吗？', 0, 0),
(3, 'buyer', 'text', '卡密收到了，非常感谢！', 1, 0),
(3, 'seller', 'text', '感谢您的购买，有问题随时联系~', 1, 0);

-- -------------------------------------------
-- 消息通知表
-- -------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '通知ID',
    `user_id` INT UNSIGNED DEFAULT NULL COMMENT '用户ID',
    `type` ENUM('order', 'stock', 'error', 'system') NOT NULL COMMENT '通知类型',
    `title` VARCHAR(255) NOT NULL COMMENT '标题',
    `content` TEXT DEFAULT NULL COMMENT '内容',
    `related_id` INT UNSIGNED DEFAULT NULL COMMENT '关联ID',
    `is_read` TINYINT(1) DEFAULT 0 COMMENT '是否已读',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_is_read` (`is_read`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息通知表';

-- 测试数据：通知
INSERT INTO `notifications` (`user_id`, `type`, `title`, `content`, `related_id`, `is_read`) VALUES
(1, 'order', '新订单提醒', '您有一笔新订单待处理，订单号：ORD202601300005', 5, 0),
(1, 'stock', '库存预警', '商品「春季新款卫衣」库存不足，当前库存：30件', 4, 0),
(1, 'error', '账号异常', '账号「百货测试号」登录状态异常，请检查Cookie是否过期', 4, 1),
(1, 'system', '系统通知', '欢迎使用闲鱼管理系统，如有问题请联系管理员', NULL, 1);

-- -------------------------------------------
-- 发货日志表
-- -------------------------------------------
DROP TABLE IF EXISTS `delivery_logs`;
CREATE TABLE `delivery_logs` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '日志ID',
    `order_id` INT UNSIGNED NOT NULL COMMENT '订单ID',
    `coupon_id` INT UNSIGNED DEFAULT NULL COMMENT '卡券ID',
    `content` TEXT DEFAULT NULL COMMENT '发货内容',
    `status` ENUM('success', 'failed') NOT NULL COMMENT '状态',
    `error_message` VARCHAR(255) DEFAULT NULL COMMENT '错误信息',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='发货日志表';

-- 测试数据：发货日志
INSERT INTO `delivery_logs` (`order_id`, `coupon_id`, `content`, `status`) VALUES
(3, 3, 'STEAM-XXXX-YYYY-ZZZZ-0003', 'success');

-- -------------------------------------------
-- 系统配置表
-- -------------------------------------------
DROP TABLE IF EXISTS `system_configs`;
CREATE TABLE `system_configs` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
    `key` VARCHAR(100) NOT NULL COMMENT '配置键',
    `value` TEXT DEFAULT NULL COMMENT '配置值',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 初始化系统配置
INSERT INTO `system_configs` (`key`, `value`, `description`) VALUES
('site_name', '闲鱼管理系统', '站点名称'),
('auto_reply_enabled', '1', '自动回复总开关'),
('auto_delivery_enabled', '1', '自动发货总开关'),
('notification_sound', '1', '消息提示音'),
('stock_warning_threshold', '10', '库存预警阈值');

SET FOREIGN_KEY_CHECKS = 1;
