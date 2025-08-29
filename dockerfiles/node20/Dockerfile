# 使用多阶段构建减小镜像体积
FROM node:20.19 AS builder
WORKDIR /data

# 暴露端口
EXPOSE 3000
EXPOSE 3001
EXPOSE 3002
EXPOSE 3003


CMD ["npm", "run", "dev"]