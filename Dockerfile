# syntax=docker/dockerfile:1

# ---------- Stage 1: build the Vite app ----------
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first for better layer caching.
COPY app-revamp/package.json app-revamp/package-lock.json ./
RUN npm ci

# Build the production bundle.
COPY app-revamp/ ./
# Build-time API config (override at build with --build-arg).
ARG VITE_API_URL=https://api.saomiguelbus.com
ARG VITE_ISLAND_KEY=sao-miguel
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ISLAND_KEY=$VITE_ISLAND_KEY
RUN npm run build

# ---------- Stage 2: serve static files with nginx ----------
FROM nginx:1.27-alpine AS runtime
COPY app-revamp/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
