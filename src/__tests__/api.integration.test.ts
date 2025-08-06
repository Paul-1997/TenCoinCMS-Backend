import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../lib/prisma';
import Fastify from 'fastify';
import productRoutes from '../routes/products';
import orderRoutes from '../routes/orders';
import healthRoutes from '../routes/health';

const fastify = Fastify();

// 測試資料
const testProduct = {
  name: '測試產品',
  barcode: 'TEST-001',
  status: 'ACTIVE' as const,
  costPrice: 10,
  sellPrice: 20,
  imagePath: 'https://example.com/test.jpg',
  tags: ['測試', '產品'],
  vendors: ['01'],
  isOrdered: false,
  note: '測試產品',
};

describe('API 整合測試', () => {

  beforeAll(async () => {
    // 註冊路由
    await fastify.register(healthRoutes, { prefix: '/api/v1' });
    await fastify.register(productRoutes, { prefix: '/api/v1' });
    await fastify.register(orderRoutes, { prefix: '/api/v1' });
    
    // 啟動測試伺服器
    await fastify.listen({ port: 0 });
  });

  afterAll(async () => {
    // 清理測試資料
    await prisma.product.deleteMany({
      where: { barcode: testProduct.barcode },
    });
    
    await fastify.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 每個測試前清理測試資料
    await prisma.product.deleteMany({
      where: { barcode: testProduct.barcode },
    });
  });

  describe('健康檢查 API', () => {
    it('應該成功取得基本健康檢查', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.message).toBe('服務運行正常');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
    });

    it('應該成功取得資料庫健康檢查', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/health/db',
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.message).toBe('資料庫連接正常');
      expect(result).toHaveProperty('stats');
      expect(result.stats).toHaveProperty('products');
      expect(result.stats).toHaveProperty('orders');
    });

    it('應該成功取得完整健康檢查', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/health/full',
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.message).toBe('所有服務運行正常');
      expect(result).toHaveProperty('checks');
      expect(result.checks).toHaveProperty('server');
      expect(result.checks).toHaveProperty('database');
    });
  });

  describe('產品 API', () => {
    it('應該成功取得所有產品', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/products',
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('應該成功建立產品', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/products',
        payload: testProduct,
      });

      expect(response.statusCode).toBe(201);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe(testProduct.name);
      expect(result.data.barcode).toBe(testProduct.barcode);
      

    });

    it('應該成功取得特定產品', async () => {
      // 先建立產品
      const createResponse = await fastify.inject({
        method: 'POST',
        url: '/api/v1/products',
        payload: testProduct,
      });
      
      const createdProduct = JSON.parse(createResponse.payload).data;

      const response = await fastify.inject({
        method: 'GET',
        url: `/api/v1/products/${createdProduct.id}`,
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(createdProduct.id);
      expect(result.data.name).toBe(testProduct.name);
    });

    it('應該成功更新產品', async () => {
      // 先建立產品
      const createResponse = await fastify.inject({
        method: 'POST',
        url: '/api/v1/products',
        payload: testProduct,
      });
      
      const createdProduct = JSON.parse(createResponse.payload).data;

      const updateData = {
        name: '更新產品名稱',
        sellPrice: 25,
      };

      const response = await fastify.inject({
        method: 'PUT',
        url: `/api/v1/products/${createdProduct.id}`,
        payload: updateData,
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe(updateData.name);
      expect(Number(result.data.sellPrice)).toBe(updateData.sellPrice);
    });

    it('應該成功刪除產品', async () => {
      // 先建立產品
      const createResponse = await fastify.inject({
        method: 'POST',
        url: '/api/v1/products',
        payload: testProduct,
      });
      
      const createdProduct = JSON.parse(createResponse.payload).data;

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/api/v1/products/${createdProduct.id}`,
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
    });
  });

  describe('訂單 API', () => {
    it('應該成功取得所有訂單', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/orders',
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('應該成功建立訂單', async () => {
      // 先建立產品並確保成功
      const createProductResponse = await fastify.inject({
        method: 'POST',
        url: '/api/v1/products',
        payload: testProduct,
      });
      
      expect(createProductResponse.statusCode).toBe(201);
      const createdProduct = JSON.parse(createProductResponse.payload).data;
      expect(createdProduct.id).toBeDefined();

      // 驗證產品確實存在於資料庫中
      const productInDb = await prisma.product.findUnique({
        where: { id: createdProduct.id }
      });
      expect(productInDb).not.toBeNull();

      const orderData = {
        note: '測試訂單',
        items: [
          {
            productId: createdProduct.id,
            quantity: 2,
          },
        ],
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/orders',
        payload: orderData,
      });

      // 如果失敗，顯示詳細錯誤訊息
      if (response.statusCode !== 201) {
        console.error('訂單創建失敗:', {
          statusCode: response.statusCode,
          payload: response.payload,
          orderData,
          createdProduct,
          productInDb,
        });
      }

      expect(response.statusCode).toBe(201);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.note).toBe(orderData.note);
      expect(result.data.items).toHaveLength(1);
    });
  });
});