#!/bin/bash

echo "🚀 TenCoin CMS Backend 設定腳本"
echo "================================"

# 檢查 Node.js 版本
echo "📋 檢查 Node.js 版本..."
NODE_VERSION=$(node -v)
echo "Node.js 版本: $NODE_VERSION"

# 檢查 pnpm 是否安裝
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm 未安裝，正在安裝..."
    npm install -g pnpm
else
    echo "✅ pnpm 已安裝"
fi

# 安裝依賴項
echo "📦 安裝依賴項..."
pnpm install

# 檢查 .env 文件
if [ ! -f .env ]; then
    echo "📝 建立 .env 文件..."
    cp env.example .env
    echo "⚠️  請編輯 .env 文件，設定資料庫連線和 API 金鑰"
else
    echo "✅ .env 文件已存在"
fi

# 生成 Prisma 客戶端
echo "🔧 生成 Prisma 客戶端..."
pnpm db:generate

echo ""
echo "🎉 設定完成！"
echo ""
echo "下一步："
echo "1. 編輯 .env 文件，設定資料庫連線"
echo "2. 執行 'pnpm db:push' 建立資料庫"
echo "3. 執行 'pnpm db:seed' 初始化測試資料"
echo "4. 執行 'pnpm dev' 啟動開發伺服器"
echo ""
echo "或使用 Docker Compose："
echo "docker-compose up -d" 