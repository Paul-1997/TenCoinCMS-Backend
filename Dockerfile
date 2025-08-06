# 使用 Node.js 20 Alpine 作為基礎映像
FROM node:20-alpine AS base

# 安裝依賴項
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 複製 package.json 和 lock 文件
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 建置應用程式
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma 客戶端
RUN npx prisma generate

# 建置 TypeScript
RUN npm run build

# 生產環境
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# 建立非 root 使用者
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 tencoin

# 複製建置結果
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# 設定權限
RUN chown -R tencoin:nodejs /app
USER tencoin

# 暴露端口
EXPOSE 3000

ENV PORT=3000
ENV HOST=0.0.0.0

# 啟動應用程式
CMD ["node", "dist/index.js"] 