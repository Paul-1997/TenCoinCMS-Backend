import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductService } from '../services/productService';

// Mock Prisma Client - 使用工廠函數避免提升問題
vi.mock('../lib/prisma', () => {
  return {
    prisma: {
      product: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      order: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
    },
  };
});

// Mock VendorService
vi.mock('../services/vendorService', () => ({
  VendorService: vi.fn().mockImplementation(() => ({
    validateVendorIds: vi.fn().mockResolvedValue(true),
  })),
}));

// 導入 Mock 後的 prisma
import { prisma } from '../lib/prisma';

describe('ProductService 單元測試', () => {
  let productService: ProductService;

  beforeEach(() => {
    vi.clearAllMocks();
    productService = new ProductService();
  });

  describe('getAllProducts', () => {
    it('應該成功取得所有產品', async () => {
      const mockProducts = [
        {
          id: '1',
          name: '測試產品1',
          barcode: 'TEST-001',
          status: 'ACTIVE',
          costPrice: 10,
          sellPrice: 20,
          imagePath: 'test1.jpg',
          tags: ['測試'],
          vendors: ['01'],
          isOrdered: false,
          note: '測試產品',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: '測試產品2',
          barcode: 'TEST-002',
          status: 'ACTIVE',
          costPrice: 15,
          sellPrice: 25,
          imagePath: 'test2.jpg',
          tags: ['測試'],
          vendors: ['02'],
          isOrdered: false,
          note: '測試產品',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.product.findMany.mockResolvedValue(mockProducts);

      const result = await productService.getAllProducts();

      expect(result).toEqual(mockProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('getProductById', () => {
    it('應該成功取得特定產品', async () => {
      const mockProduct = {
        id: '1',
        name: '測試產品',
        barcode: 'TEST-001',
        status: 'ACTIVE',
        costPrice: 10,
        sellPrice: 20,
        imagePath: 'test.jpg',
        tags: ['測試'],
        vendors: ['01'],
        isOrdered: false,
        note: '測試產品',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await productService.getProductById('1');

      expect(result).toEqual(mockProduct);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('應該返回 null 當產品不存在', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      const result = await productService.getProductById('999');

      expect(result).toBeNull();
    });
  });

  describe('getProductByBarcode', () => {
    it('應該成功根據條碼取得產品', async () => {
      const mockProduct = {
        id: '1',
        name: '測試產品',
        barcode: 'TEST-001',
        status: 'ACTIVE',
        costPrice: 10,
        sellPrice: 20,
        imagePath: 'test.jpg',
        tags: ['測試'],
        vendors: ['01'],
        isOrdered: false,
        note: '測試產品',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await productService.getProductByBarcode('TEST-001');

      expect(result).toEqual(mockProduct);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { barcode: 'TEST-001' },
      });
    });
  });

  describe('createProduct', () => {
    it('應該成功建立產品', async () => {
      const createData = {
        name: '新產品',
        barcode: 'NEW-001',
        costPrice: 10,
        sellPrice: 20,
        vendors: ['01'],
        imagePath: 'new.jpg',
        tags: ['新產品'],
        note: '新產品說明',
      };

      const mockCreatedProduct = {
        id: '1',
        ...createData,
        status: 'ACTIVE',
        isOrdered: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getProductByBarcode 返回 null (條碼不存在)
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue(mockCreatedProduct);

      const result = await productService.createProduct(createData);

      expect(result).toEqual(mockCreatedProduct);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: createData.name,
          barcode: createData.barcode,
          costPrice: createData.costPrice,
          sellPrice: createData.sellPrice,
          vendors: createData.vendors,
          tags: createData.tags,
        }),
      });
    });

    it('應該在條碼已存在時拋出錯誤', async () => {
      const createData = {
        name: '新產品',
        barcode: 'EXISTING-001',
        costPrice: 10,
        sellPrice: 20,
        vendors: ['01'],
        imagePath: 'new.jpg',
        tags: ['新產品'],
        note: '新產品說明',
      };

      // Mock getProductByBarcode 返回現有產品 (條碼已存在)
      prisma.product.findUnique.mockResolvedValue({
        id: 'existing',
        barcode: 'EXISTING-001',
      } as any);

      await expect(productService.createProduct(createData)).rejects.toThrow('Barcode already exists');
    });
  });

  describe('updateProduct', () => {
    it('應該成功更新產品', async () => {
      const updateData = {
        name: '更新產品',
        sellPrice: 25,
        tags: ['更新'],
      };

      const mockUpdatedProduct = {
        id: '1',
        name: '更新產品',
        barcode: 'TEST-001',
        status: 'ACTIVE',
        costPrice: 10,
        sellPrice: 25,
        imagePath: 'test.jpg',
        tags: ['更新'],
        vendors: ['01'],
        isOrdered: false,
        note: '測試產品',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.product.update.mockResolvedValue(mockUpdatedProduct);

      const result = await productService.updateProduct('1', updateData);

      expect(result).toEqual(mockUpdatedProduct);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining(updateData),
      });
    });
  });

  describe('deleteProduct', () => {
    it('應該成功刪除產品', async () => {
      prisma.product.delete.mockResolvedValue({ id: '1' });

      await productService.deleteProduct('1');

      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('getDashboardStats', () => {
    it('應該成功取得儀表板統計資料', async () => {
      prisma.product.count.mockResolvedValue(10);
      prisma.order.count.mockResolvedValue(5);

      const result = await productService.getDashboardStats();

      expect(result).toHaveProperty('totalProducts');
      expect(result).toHaveProperty('outOfStockProducts');
      expect(result).toHaveProperty('orderedProducts');
      expect(result).toHaveProperty('totalOrders');
      expect(result).toHaveProperty('todayOrders');
    });
  });
});