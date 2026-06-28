# Dev-mode image for local Docker Compose parity (NOT a production build).
# Serves the Vite dev server with HMR; source is bind-mounted in compose.
FROM node:22-alpine

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest (overlaid by the bind mount at runtime). node_modules is
# excluded via .dockerignore so the linux-native install is preserved.
COPY . .

EXPOSE 5173

# --host binds 0.0.0.0 so the dev server is reachable from outside the container.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
