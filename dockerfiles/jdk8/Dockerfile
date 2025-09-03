
FROM amazoncorretto:8
EXPOSE 9003
RUN echo Asia/Shanghai > /etc/timezone
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
# 设置字符编码和语言环境
ENV LANG en_US.UTF-8
ENV LANGUAGE zh_CN:zh

# 运行程序，修改jar目录
CMD cd /usr/data && java  -Xmn1024m -Xms2048m -Xmx2048m -Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8 -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/usr/data/logs/oom.dump -jar  xxx.jar