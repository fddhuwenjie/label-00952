# 闲鱼管理系统 - 设计规范

## 1. 设计理念

- **简洁高效**: 减少视觉噪音，突出核心信息
- **专业可信**: 商务风格，传递可靠感
- **响应适配**: 完美适配各种设备

## 2. 色彩系统

### 主色调
```
Primary: #1677ff (品牌蓝)
Primary Hover: #4096ff
Primary Active: #0958d9
```

### 功能色
```
Success: #52c41a (成功/在线)
Warning: #faad14 (警告/待处理)
Error: #ff4d4f (错误/异常)
Info: #1677ff (信息)
```

### 中性色
```
Title: #000000d9 (标题)
Text: #000000a6 (正文)
Secondary: #00000073 (辅助文字)
Border: #d9d9d9 (边框)
Background: #f5f5f5 (背景)
White: #ffffff (卡片背景)
```

## 3. 字体规范

### 字体家族
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
```

### 字号层级
| 用途 | 字号 | 行高 | 字重 |
|------|-----|------|-----|
| 大标题 | 24px | 32px | 600 |
| 页面标题 | 20px | 28px | 600 |
| 小标题 | 16px | 24px | 500 |
| 正文 | 14px | 22px | 400 |
| 辅助文字 | 12px | 20px | 400 |

## 4. 间距系统

基础单位: 4px

```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 24px
xxl: 32px
```

## 5. 圆角规范

```
Small: 4px (按钮、输入框)
Medium: 8px (卡片、弹窗)
Large: 12px (大型容器)
```

## 6. 阴影层级

```css
/* 卡片阴影 */
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03),
            0 1px 6px -1px rgba(0, 0, 0, 0.02),
            0 2px 4px 0 rgba(0, 0, 0, 0.02);

/* 弹出层阴影 */
box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08),
            0 3px 6px -4px rgba(0, 0, 0, 0.12),
            0 9px 28px 8px rgba(0, 0, 0, 0.05);
```

## 7. 响应式断点

```css
/* 手机 */
@media (max-width: 576px) { }

/* 平板竖屏 */
@media (min-width: 576px) and (max-width: 768px) { }

/* 平板横屏 */
@media (min-width: 768px) and (max-width: 992px) { }

/* 小型桌面 */
@media (min-width: 992px) and (max-width: 1200px) { }

/* 大型桌面 */
@media (min-width: 1200px) { }
```

## 8. 布局规范

### 侧边栏
- 宽度: 220px (收起: 80px)
- 背景: #001529 (深色)

### 头部
- 高度: 64px
- 背景: #ffffff

### 内容区
- 内边距: 24px
- 最大宽度: 1600px

## 9. 组件规范

### 按钮
- 高度: 32px (默认) / 40px (大) / 24px (小)
- 最小宽度: 64px

### 输入框
- 高度: 32px
- 内边距: 4px 11px

### 表格
- 行高: 54px
- 斑马纹: 偶数行 #fafafa

### 卡片
- 内边距: 24px
- 圆角: 8px

## 10. 图标规范

使用 Ant Design Icons，尺寸:
- 导航图标: 20px
- 操作图标: 16px
- 状态图标: 14px
