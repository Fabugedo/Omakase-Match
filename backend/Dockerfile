# Dev-mode image for local Docker Compose parity (NOT a production build).
# Source is bind-mounted in compose; this image just provides the toolchain +
# a linux-native node_modules so hot reload (nest start --watch) works.
FROM node:22-alpine

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest (overlaid by the bind mount at runtime; kept so the image can
# also run standalone). node_modules is excluded via .dockerignore.
COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
