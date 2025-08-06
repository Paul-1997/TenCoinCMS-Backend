import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';

describe('資料庫連接測試', () => {
  beforeAll(async () => {
    // 確保資料庫連接
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('基本連接測試', () => {
    it('應該成功連接到資料庫', async () => {
      // 執行簡單查詢測試連接
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      expect(result).toEqual([{ test: 1 }]);
    });

    it('應該能夠查詢產品表格', async () => {
      const productCount = await prisma.product.count();
      expect(typeof productCount).toBe('number');
      expect(productCount).toBeGreaterThanOrEqual(0);
    });

    it('應該能夠查詢訂單表格', async () => {
      const orderCount = await prisma.order.count();
      expect(typeof orderCount).toBe('number');
      expect(orderCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('產品表格結構測試', () => {
    it('應該能夠查詢產品的所有欄位', async () => {
      const products = await prisma.product.findMany({
        take: 1,
        select: {
          id: true,
          name: true,
          barcode: true,
          costPrice: true,
          sellPrice: true,
          imagePath: true,
          status: true,
          isOrdered: true,
          tags: true,
          vendors: true,
          note: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (products.length > 0) {
        const product = products[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('barcode');
        expect(product).toHaveProperty('costPrice');
        expect(product).toHaveProperty('sellPrice');
        expect(product).toHaveProperty('status');
        expect(product).toHaveProperty('tags');
        expect(product).toHaveProperty('vendors');
        expect(product).toHaveProperty('createdAt');
        expect(product).toHaveProperty('updatedAt');
      }
    });

    it('應該能夠根據條碼查詢產品', async () => {
      const products = await prisma.product.findMany({
        take: 1,
        where: {
          barcode: {
            not: '',
          },
        },
      });

      if (products.length > 0) {
        const product = products[0];
        const foundProduct = await prisma.product.findUnique({
          where: { barcode: product.barcode },
        });

        expect(foundProduct).not.toBeNull();
        expect(foundProduct?.id).toBe(product.id);
      }
    });

    it('應該能夠根據狀態過濾產品', async () => {
      const activeProducts = await prisma.product.findMany({
        where: { status: 'ACTIVE' },
      });

      expect(Array.isArray(activeProducts)).toBe(true);
      activeProducts.forEach(product => {
        expect(product.status).toBe('ACTIVE');
      });
    });
  });

  describe('訂單表格結構測試', () => {
    it('應該能夠查詢訂單的所有欄位', async () => {
      const orders = await prisma.order.findMany({
        take: 1,
        select: {
          id: true,
          note: true,
          createdAt: true,
          items: {
            select: {
              id: true,
              quantity: true,
              orderId: true,
              productId: true,
            },
          },
        },
      });

      if (orders.length > 0) {
        const order = orders[0];
        expect(order).toHaveProperty('id');
        expect(order).toHaveProperty('note');
        expect(order).toHaveProperty('createdAt');
        expect(order).toHaveProperty('items');
        expect(Array.isArray(order.items)).toBe(true);
      }
    });
  });

  describe('關聯查詢測試', () => {
    it('應該能夠查詢產品及其訂單項目', async () => {
      const products = await prisma.product.findMany({
        take: 1,
        include: {
          orderItems: {
            include: {
              order: true,
            },
          },
        },
      });

      if (products.length > 0) {
        const product = products[0];
        expect(product).toHaveProperty('orderItems');
        expect(Array.isArray(product.orderItems)).toBe(true);
      }
    });

    it('應該能夠查詢訂單及其項目', async () => {
      const orders = await prisma.order.findMany({
        take: 1,
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (orders.length > 0) {
        const order = orders[0];
        expect(order).toHaveProperty('items');
        expect(Array.isArray(order.items)).toBe(true);
      }
    });
  });
}); 