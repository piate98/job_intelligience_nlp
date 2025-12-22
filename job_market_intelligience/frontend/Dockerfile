# Build
# ---- build stage ----
# ---------- Build stage ----------
# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# Copy deps first
COPY package.json package-lock.json ./
RUN npm ci

# Copy app source
COPY . .

# Build Vite app
RUN npm run build

# ---------- Run stage ----------
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]