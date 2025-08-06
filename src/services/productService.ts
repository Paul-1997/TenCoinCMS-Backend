import { Product, ProductStatus } from '@prisma/client';
import { CreateProductRequest, UpdateProductRequest, ProductQueryParams } from '@/types';
import { VendorService } from '@/services/vendorService';
import { prisma } from '@/lib/prisma';

const vendorService = new VendorService();

export class ProductService {
  async getAllProducts(): Promise<Product[]> {
    return prisma.product.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getProducts(params: ProductQueryParams = {}) {
    const {
      page = 1,
      pageSize = 20,
      status,
      isOrdered,
      keyword,
      tags,
      vendors,
    } = params;

    const skip = (page - 1) * pageSize;
    
    // 建立查詢條件
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (isOrdered !== undefined) {
      where.isOrdered = isOrdered;
    }
    
    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { barcode: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    if (vendors && vendors.length > 0) {
      where.vendors = {
        hasSome: vendors,
      };
    }

    // 執行查詢
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getProductById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { id },
    });
  }

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { barcode },
    });
  }

  async createProduct(data: CreateProductRequest): Promise<Product> {
    // 檢查條碼是否已存在
    const existingProduct = await this.getProductByBarcode(data.barcode);
    if (existingProduct) {
      throw new Error('Barcode already exists');
    }

    // 驗證廠商 ID
    if (data.vendors && data.vendors.length > 0) {
      const isValid = await vendorService.validateVendorIds(data.vendors);
      if (!isValid) {
        throw new Error('Invalid vendor IDs');
      }
    }

    return prisma.product.create({
      data: {
        name: data.name,
        barcode: data.barcode,
        costPrice: data.costPrice,
        sellPrice: data.sellPrice,
        vendors: data.vendors || [],
        imagePath: data.imagePath || null,
        tags: data.tags || [],
        note: data.note ?? null,
      },
    });
  }

  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
    // 檢查產品是否存在
    const existingProduct = await this.getProductById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // 如果更新條碼，檢查是否與其他產品衝突
    if (data.barcode && data.barcode !== existingProduct.barcode) {
      const barcodeExists = await this.getProductByBarcode(data.barcode);
      if (barcodeExists) {
        throw new Error('Barcode already exists');
      }
    }

    // 驗證廠商 ID
    if (data.vendors && data.vendors.length > 0) {
      const isValid = await vendorService.validateVendorIds(data.vendors);
      if (!isValid) {
        throw new Error('Invalid vendor IDs');
      }
    }

    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.barcode !== undefined) updateData.barcode = data.barcode;
    if (data.costPrice !== undefined) updateData.costPrice = data.costPrice;
    if (data.sellPrice !== undefined) updateData.sellPrice = data.sellPrice;
    if (data.vendors !== undefined) updateData.vendors = data.vendors;
    if (data.imagePath !== undefined) updateData.imagePath = data.imagePath;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isOrdered !== undefined) updateData.isOrdered = data.isOrdered;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.note !== undefined) updateData.note = data.note;

    return prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteProduct(id: string): Promise<void> {
    const existingProduct = await this.getProductById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    await prisma.product.delete({
      where: { id },
    });
  }

  async updateProductStatus(id: string, status: ProductStatus): Promise<Product> {
    const existingProduct = await this.getProductById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    return prisma.product.update({
      where: { id },
      data: { status },
    });
  }

  async updateProductOrderStatus(id: string, isOrdered: boolean): Promise<Product> {
    const existingProduct = await this.getProductById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    return prisma.product.update({
      where: { id },
      data: { isOrdered },
    });
  }

  async getDashboardStats() {
    const [totalProducts, outOfStockProducts, orderedProducts, totalOrders, todayOrders] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: 'OUT_OF_STOCK' } }),
      prisma.product.count({ where: { isOrdered: true } }),
      prisma.order.count(),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      totalProducts,
      outOfStockProducts,
      orderedProducts,
      totalOrders,
      todayOrders,
    };
  }
}

