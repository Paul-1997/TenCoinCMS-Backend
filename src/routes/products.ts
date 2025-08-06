import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
// ✅ 使用統一的 Prisma 實例
import { prisma } from '@/lib/prisma';

// 產品創建驗證 schema
const createProductSchema = z.object({
  name: z.string().min(1, '產品名稱不能為空'),
  barcode: z.string().min(1, '條碼不能為空'),
  costPrice: z.number().positive('成本價必須為正數'),
  sellPrice: z.number().positive('售價必須為正數'),
  vendorIds: z.array(z.string()).optional().default([]),
  imagePath: z.string().optional(),
  status: z.enum(['ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED']).optional().default('ACTIVE'),
  tags: z.array(z.string()).optional().default([]),
  note: z.string().optional()
});

// 查詢參數驗證 schema
const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED']).optional(),
  tags: z.string().optional()
});

export default async function productRoutes(fastify: FastifyInstance) {
  // 獲取所有產品
  fastify.get('/products', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = querySchema.parse(request.query);
      const skip = (query.page - 1) * query.limit;
      
      // 構建查詢條件
      const where: any = {};
      
      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { barcode: { contains: query.search, mode: 'insensitive' } },
          { note: { contains: query.search, mode: 'insensitive' } }
        ];
      }
      
      if (query.status) {
        where.status = query.status;
      }
      
      if (query.tags) {
        where.tags = { hasSome: query.tags.split(',') };
      }
      
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: query.limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.product.count({ where })
      ]);
      
      return {
        success: true,
        data: products,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          pages: Math.ceil(total / query.limit)
        }
      };
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: '查詢參數錯誤',
        details: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  });

  // 獲取單個產品
  fastify.get('/products/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          orderItems: {
            include: {
              order: true
            }
          }
        }
      });
      
      if (!product) {
        return reply.status(404).send({
          success: false,
          error: '產品不存在'
        });
      }
      
      return {
        success: true,
        data: product
      };
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: '獲取產品失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  });

  // 創建產品
  fastify.post('/products', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const productData = createProductSchema.parse(request.body);
      
      // 檢查條碼是否已存在
      const existingProduct = await prisma.product.findUnique({
        where: { barcode: productData.barcode }
      });
      
      if (existingProduct) {
        return reply.status(400).send({
          success: false,
          error: '條碼已存在'
        });
      }
      
      const product = await prisma.product.create({
        data: {
          name: productData.name,
          barcode: productData.barcode,
          costPrice: productData.costPrice,
          sellPrice: productData.sellPrice,
          imagePath: productData.imagePath || null,
          status: productData.status,
          tags: productData.tags,
          note: productData.note || null,
          vendors: productData.vendorIds || [] // 直接設定廠商 ID 陣列
        }
      });
      
      reply.status(201).send({
        success: true,
        data: product,
        message: '產品創建成功'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: '驗證錯誤',
          details: error.errors
        });
      }
      
      reply.status(500).send({
        success: false,
        error: '創建產品失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  });

  // 更新產品
  fastify.put('/products/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const updateData = createProductSchema.partial().parse(request.body);
      
      // 檢查產品是否存在
      const existingProduct = await prisma.product.findUnique({
        where: { id }
      });
      
      if (!existingProduct) {
        return reply.status(404).send({
          success: false,
          error: '產品不存在'
        });
      }
      
      // 如果更新條碼，檢查是否與其他產品衝突
      if (updateData.barcode && updateData.barcode !== existingProduct.barcode) {
        const duplicateBarcode = await prisma.product.findUnique({
          where: { barcode: updateData.barcode }
        });
        
        if (duplicateBarcode) {
          return reply.status(400).send({
            success: false,
            error: '條碼已存在'
          });
        }
      }
      
      const updatePayload: any = {};
      if (updateData.name !== undefined) updatePayload.name = updateData.name;
      if (updateData.barcode !== undefined) updatePayload.barcode = updateData.barcode;
      if (updateData.costPrice !== undefined) updatePayload.costPrice = +updateData.costPrice;
      if (updateData.sellPrice !== undefined) updatePayload.sellPrice = +updateData.sellPrice;
      if (updateData.vendorIds !== undefined) updatePayload.vendors = updateData.vendorIds;
      if (updateData.imagePath !== undefined) updatePayload.imagePath = updateData.imagePath || null;
      if (updateData.status !== undefined) updatePayload.status = updateData.status;
      if (updateData.tags !== undefined) updatePayload.tags = updateData.tags;
      if (updateData.note !== undefined) updatePayload.note = updateData.note || null;
      
      const product = await prisma.product.update({
        where: { id },
        data: updatePayload
      });
      
      return {
        success: true,
        data: product,
        message: '產品更新成功'
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: '驗證錯誤',
          details: error.errors
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: '更新產品失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  });

  // 刪除產品
  fastify.delete('/products/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      // 檢查產品是否存在
      const existingProduct = await prisma.product.findUnique({
        where: { id },
        include: {
          orderItems: true
        }
      });
      
      if (!existingProduct) {
        return reply.status(404).send({
          success: false,
          error: '產品不存在'
        });
      }
      
      // 檢查是否有相關訂單
      if (existingProduct.orderItems.length > 0) {
        return reply.status(400).send({
          success: false,
          error: '無法刪除產品，該產品已有相關訂單'
        });
      }
      
      await prisma.product.delete({
        where: { id }
      });
      
      return {
        success: true,
        message: '產品刪除成功'
      };
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: '刪除產品失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  });

  // 批量操作
  fastify.post('/products/batch', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { action, ids } = request.body as { action: string; ids: string[] };
      
      if (!ids || ids.length === 0) {
        return reply.status(400).send({
          success: false,
          error: '請提供產品 ID 列表'
        });
      }
      
      switch (action) {
        case 'delete': {
          const deleteResult = await prisma.product.deleteMany({
            where: {
              id: { in: ids },
              orderItems: { none: {} } // 只刪除沒有訂單的產品
            }
          });
          
          return {
            success: true,
            data: { deletedCount: deleteResult.count },
            message: `成功刪除 ${deleteResult.count} 個產品`
          };
        }
          
        case 'updateStatus': {
          const { status } = request.body as { status: string };
          
          if (!['ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED'].includes(status)) {
            return reply.status(400).send({
              success: false,
              error: '無效的狀態值'
            });
          }
          
          const updateResult = await prisma.product.updateMany({
            where: { id: { in: ids } },
            data: { status: status as any }
          });
          
          return {
            success: true,
            data: { updatedCount: updateResult.count },
            message: `成功更新 ${updateResult.count} 個產品狀態`
          };
        }
          
        default:
          return reply.status(400).send({
            success: false,
            error: '無效的操作類型'
          });
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: '批量操作失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  });
} 