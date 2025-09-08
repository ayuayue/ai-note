FROM xuxueli/xxl-job-admin:3.2.0

EXPOSE 8080

# 无需复制 application.properties，直接通过环境变量覆盖配置
ENV SPRING_DATASOURCE_URL="jdbc:mysql://host.docker.internal:3306/xxl_job?useSSL=false&serverTimezone=Asia/Shanghai"
ENV SPRING_DATASOURCE_USERNAME="root"
ENV SPRING_DATASOURCE_PASSWORD="root"
ENV XXL_JOB_ACCESSTOKEN=""