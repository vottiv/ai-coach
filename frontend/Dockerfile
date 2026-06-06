# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Build stage - оставляем для production
FROM base AS build
RUN npm run build

# Runtime stage для nginx (production)
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Dev stage - для hot-reload
FROM base AS dev
EXPOSE 5173
CMD ["npm", "run", "dev"]