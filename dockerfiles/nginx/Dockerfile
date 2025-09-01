FROM nginx:1.19.1-alpine

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./php74.conf /etc/nginx/conf.d/php74.conf
COPY ./fastcgi_params /etc/nginx/fastcgi_params
COPY ./fastcgi-php.conf /etc/nginx/fastcgi-php.conf

EXPOSE 80
EXPOSE 443

RUN sed -i "s/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g" /etc/apk/repositories

WORKDIR /www
