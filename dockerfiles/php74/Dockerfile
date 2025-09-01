FROM php:7.4-fpm

RUN apt-get update && apt-get install -y \
		libfreetype-dev \
		libjpeg62-turbo-dev \
		libpng-dev \
        autoconf \
        libicu-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
	&& docker-php-ext-install -j$(nproc) gd

# 安装 PHP 核心扩展
RUN docker-php-ext-install pdo_mysql bcmath 

# 安装 Redis 扩展
RUN pecl install redis \
    && docker-php-ext-enable redis

RUN curl -o /usr/bin/composer https://mirrors.aliyun.com/composer/composer.phar \
    && chmod +x /usr/bin/composer \
    && composer config -g repo.packagist composer https://mirrors.aliyun.com/composer/

# RUN docker-php-source extract \
# 	# do important things \
# 	&& docker-php-source delete


EXPOSE 9000


ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US.UTF-8