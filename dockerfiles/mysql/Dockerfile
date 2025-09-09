FROM mysql/mysql-server:5.7

# 设置 root 密码
ENV MYSQL_ROOT_PASSWORD=root

# 暴露端口
EXPOSE 3306
EXPOSE 33060

# 设置字符集
RUN echo "character-set-server=utf8mb4" >> /etc/my.cnf && \
    echo "collation-server=utf8mb4_unicode_ci" >> /etc/my.cnf

# 复制初始化脚本
COPY ./nacos2.3.2/mysql-schema.sql /docker-entrypoint-initdb.d/nacos.sql
COPY ./xxl-job/db.sql /docker-entrypoint-initdb.d/xxl-job.sql

# 设置工作目录
WORKDIR /var/lib/mysql