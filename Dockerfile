# 指定基础镜像
FROM node:22-alpine
# 创建对应的文件夹，作为项目运行的位置
RUN mkdir -p /usr/src/app
# 指定工作区，后面的任何命令都是在这个工作区中完成的
WORKDIR /usr/src/app
# 从本地拷贝文件到工作区
COPY package.json package-lock.json /usr/src/app/
# 安装依赖
RUN npm install
# 拷贝当前工作目录到工作区文件夹
COPY . /usr/src/app/
# tsc 编译
RUN npm run tsc
# 告知 Docker image 暴露 7001端口
EXPOSE 7001
# 执行启动命令
CMD npx egg-scripts start --title=tjrf-lego-backend