# Build stage
FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json* ./
RUN npm ci --omit=dev && chown -R node:node /app

USER node
EXPOSE 3000
CMD ["npm", "start"]

# Development stage
FROM node:22-alpine AS dev

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
