FROM node:17.5.0-alpine AS build
WORKDIR /home/node
COPY --chown=node:node package.json yarn.lock ./
RUN yarn install --check-files
COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node public ./public
COPY --chown=node:node src ./src
RUN yarn build
FROM nginxinc/nginx-unprivileged:alpine
ENV NGINX_ENVSUBST_TEMPLATE_SUFFIX .conf
COPY nginx.conf /etc/nginx/templates/default.conf.conf
COPY --from=build --chown=root:root /home/node/build /usr/share/nginx/html
