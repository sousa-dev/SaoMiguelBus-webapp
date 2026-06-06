# syntax=docker/dockerfile:1

# ---------- Stage 1: build the Vite app ----------
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Build the production bundle.
COPY . .
# Build-time config (override with --build-arg).
ARG VITE_API_URL=https://api.saomiguelbus.com
ARG VITE_ISLAND_KEY=sao-miguel
ARG VITE_SITE_URL=https://app.saomiguelbus.com
ARG VITE_BASE_DOMAIN=saomiguelbus.com
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ISLAND_KEY=$VITE_ISLAND_KEY
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_BASE_DOMAIN=$VITE_BASE_DOMAIN
RUN npm run build

# ---------- Stage 2: serve static files with nginx ----------
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
