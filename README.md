# TenCoin CMS Backend

雜貨店管理系統後端 API，使用 Fastify + Prisma + PostgreSQL (Supabase)。

## 🚀 快速開始

### 1. 環境設定

複製環境變數檔案：
```bash
cp env.example .env
```

編輯 `.env` 檔案，設定您的 Supabase 資料庫連接：
```env
# Supabase 資料庫配置
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# API 配置
PORT=3000
HOST=0.0.0.0
API_HOST=localhost:3000

# 日誌配置
LOG_LEVEL=info

# 環境
NODE_ENV=development
```

### 2. 安裝依賴

```bash
pnpm install
```

### 3. 資料庫設定

生成 Prisma 客戶端：
```bash
pnpm db:generate
```

推送資料庫結構到 Supabase：
```bash
pnpm db:push
```

### 4. 啟動開發伺服器

```bash
pnpm dev
```

伺服器將在 `http://localhost:3000` 啟動。

## 📚 API 文件

啟動伺服器後，可以訪問以下端點：

- **API 文件**: http://localhost:3000/docs
- **健康檢查**: http://localhost:3000/api/v1/health
- **資料庫健康檢查**: http://localhost:3000/api/v1/health/db

## 🗄️ 資料庫結構

### 主要模型

| 模型 | 描述 | 主要欄位 |
|------|------|----------|
| `products` | 產品資訊 | id, name, barcode, costPrice, sellPrice, status, tags |
| `vendors` | 廠商資訊 | id, name |
| `orders` | 訂單資訊 | id, note, createdAt |
| `order_items` | 訂單項目 | id, quantity, price, orderId, productId |

### 關係結構

- **產品 ↔ 廠商**: 多對多關係 (通過 `_ProductToVendor` 連接表)
- **訂單 → 訂單項目**: 一對多關係
- **產品 → 訂單項目**: 一對多關係

## 🔗 API 端點

### 產品管理

| 方法 | 端點 | 描述 |
|------|------|------|
| GET | `/api/v1/products` | 獲取產品列表 (支援分頁、搜尋、篩選) |
| GET | `/api/v1/products/:id` | 獲取單個產品詳情 |
| POST | `/api/v1/products` | 創建新產品 |
| PUT | `/api/v1/products/:id` | 更新產品 |
| DELETE | `/api/v1/products/:id` | 刪除產品 |
| POST | `/api/v1/products/batch` | 批量操作 (刪除、更新狀態) |

### 訂單管理

| 方法 | 端點 | 描述 |
|------|------|------|
| GET | `/api/v1/orders` | 獲取訂單列表 (支援分頁、日期篩選) |
| GET | `/api/v1/orders/:id` | 獲取單個訂單詳情 |
| POST | `/api/v1/orders` | 創建新訂單 |
| PUT | `/api/v1/orders/:id` | 更新訂單 |
| DELETE | `/api/v1/orders/:id` | 刪除訂單 |
| GET | `/api/v1/orders/stats` | 獲取訂單統計 |

### 健康檢查

| 方法 | 端點 | 描述 |
|------|------|------|
| GET | `/api/v1/health` | 基本健康檢查 |
| GET | `/api/v1/health/db` | 資料庫健康檢查 |
| GET | `/api/v1/health/full` | 完整健康檢查 |

## 📝 使用範例

### 創建產品

```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "可口可樂",
    "barcode": "1234567890123",
    "costPrice": 15.00,
    "sellPrice": 25.00,
    "tags": ["飲料", "碳酸"],
    "note": "330ml 罐裝"
  }'
```

### 創建訂單

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "note": "客戶訂單",
    "items": [
      {
        "productId": "product-id-here",
        "quantity": 5,
        "price": 25.00
      }
    ]
  }'
```

### 查詢產品

```bash
# 基本查詢
curl "http://localhost:3000/api/v1/products"

# 分頁查詢
curl "http://localhost:3000/api/v1/products?page=1&limit=10"

# 搜尋產品
curl "http://localhost:3000/api/v1/products?search=可樂"

# 按狀態篩選
curl "http://localhost:3000/api/v1/products?status=ACTIVE"
```

## 🛠️ 開發指令

```bash
# 開發模式
pnpm dev

# 建置專案
pnpm build

# 啟動生產伺服器
pnpm start

# 資料庫相關
pnpm db:generate    # 生成 Prisma 客戶端
pnpm db:push        # 推送資料庫結構
pnpm db:migrate     # 執行資料庫遷移
pnpm db:studio      # 開啟 Prisma Studio
pnpm db:seed        # 執行資料填充
pnpm db:test        # 測試資料庫連接

# 程式碼品質
pnpm lint           # 檢查程式碼風格
pnpm lint:fix       # 自動修正程式碼風格
pnpm format         # 格式化程式碼

# 測試
pnpm test           # 執行測試
pnpm test:coverage  # 執行測試並生成覆蓋率報告
```

## 🔧 技術棧

- **框架**: Fastify
- **資料庫**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **驗證**: Zod
- **文件**: Swagger/OpenAPI
- **語言**: TypeScript
- **套件管理**: pnpm

## 📁 專案結構

```
src/
├── routes/          # API 路由
│   ├── products.ts  # 產品相關 API
│   ├── orders.ts    # 訂單相關 API
│   └── health.ts    # 健康檢查 API
├── scripts/         # 腳本檔案
│   └── test-db-connection.ts
├── index.ts         # 主應用檔案
└── types/           # TypeScript 類型定義

prisma/
└── schema.prisma    # 資料庫結構定義
```

## 🚨 注意事項

1. 確保 Supabase 專案已正確設定
2. 資料庫連接字串格式必須正確 (新版本使用 pooler)
3. 在生產環境中請設定適當的 CORS 政策
4. 建議使用環境變數管理敏感資訊
5. 產品與廠商是多對多關係，通過連接表管理

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License 