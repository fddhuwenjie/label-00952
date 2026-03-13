# 闲鱼管理系统 - 后端 Dockerfile
# 使用 Apache 内置版本，减少依赖安装

FROM php:8.2-apache

# 启用 Apache rewrite 模块
RUN a2enmod rewrite

# 安装 PHP MySQL 扩展
RUN docker-php-ext-install pdo pdo_mysql mysqli

# 设置工作目录
WORKDIR /var/www/html

# 配置 Apache
RUN echo '<VirtualHost *:80>\n\
    DocumentRoot /var/www/html/public\n\
    <Directory /var/www/html/public>\n\
        AllowOverride All\n\
        Require all granted\n\
        FallbackResource /index.php\n\
    </Directory>\n\
</VirtualHost>' > /etc/apache2/sites-available/000-default.conf

# 复制应用代码
COPY . .

# 设置权限
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage

# 暴露端口
EXPOSE 80
