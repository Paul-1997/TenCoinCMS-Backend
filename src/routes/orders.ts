import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// 訂單項目驗證 schema
const orderItemSchema = z.object({
  productId: z.string().min(1, '產品 ID 不能為空'),
  quantity: z.number().positive('數量必須為正數'),
});

// 訂單創建驗證 schema
const createOrderSchema = z.object({
  note: z.string().optional(),
  items: z.array(orderItemSchema).min(1, '至少需要一個訂單項目')
});

// 查詢參數驗證 schema
const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

export default async function orderRoutes(fastify: FastifyInstance) {
  // 獲取所有訂單
  fastify.get('/orders', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = querySchema.parse(request.query);
      const skip = (query.page - 1) * query.limit;
      
      // 構建查詢條件
      const where: any = {};
      
      if (query.startDate || query.endDate) {
        where.createdAt = {};
        if (query.startDate) {
          where.createdAt.gte = new Date(query.startDate);
        }
        if (query.endDate) {
          where.createdAt.lte = new Date(query.endDate);
        }
      }
      
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: query.limit,
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }),
        prisma.order.count({ where })
      ]);
      
      return {
        success: true,
        data: orders,
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

  // 獲取單個訂單
  fastify.get('/orders/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });
      
      if (!order) {
        return reply.status(404).send({
          success: false,
          error: '訂單不存在'
        });
      }
      
      return {
        success: true,
        data: order
      };
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: '獲取訂單失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  });

  // 創建訂單
  fastify.post('/orders', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orderData = createOrderSchema.parse(request.body);
      
      // 驗證所有產品是否存在
      const productIds = orderData.items.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } }
      });
      
      if (products.length !== productIds.length) {
        return reply.status(400).send({
          success: false,
          error: '部分產品不存在'
        });
      }
      
      // 創建訂單和訂單項目
      const order = await prisma.order.create({
        data: {
          note: orderData.note || null,
          items: {
            create: orderData.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });
      
      // 更新產品的訂單狀態
      await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { isOrdered: true }
      });
      
      reply.status(201).send({
        success: true,
        data: order,
        message: '訂單創建成功'
      });
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
        error: '創建訂單失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  });

  // 更新訂單
  fastify.put('/orders/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const updateData = createOrderSchema.partial().parse(request.body);
      
      // 檢查訂單是否存在
      const existingOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          items: true
        }
      });
      
      if (!existingOrder) {
        return reply.status(404).send({
          success: false,
          error: '訂單不存在'
        });
      }
      
      // 開始事務
      const order = await prisma.$transaction(async (tx) => {
        // 如果更新項目，先刪除現有項目
        if (updateData.items) {
          await tx.orderItem.deleteMany({
            where: { orderId: id }
          });
          
          // 創建新項目
          await tx.orderItem.createMany({
            data: updateData.items.map(item => ({
              orderId: id,
              productId: item.productId,
              quantity: item.quantity,
            }))
          });
        }
        
        // 更新訂單基本信息
        const updatePayload: any = {};
        if (updateData.note !== undefined) updatePayload.note = updateData.note || null;
        
        return await tx.order.update({
          where: { id },
          data: updatePayload,
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        });
      });
      
      return {
        success: true,
        data: order,
        message: '訂單更新成功'
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
        error: '更新訂單失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  });

  // 刪除訂單
  fastify.delete('/orders/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      // 檢查訂單是否存在
      const existingOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          items: true
        }
      });
      
      if (!existingOrder) {
        return reply.status(404).send({
          success: false,
          error: '訂單不存在'
        });
      }
      
      // 開始事務
      await prisma.$transaction(async (tx) => {
        // 刪除訂單項目
        await tx.orderItem.deleteMany({
          where: { orderId: id }
        });
        
        // 刪除訂單
        await tx.order.delete({
          where: { id }
        });
      });
      
      return {
        success: true,
        message: '訂單刪除成功'
      };
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: '刪除訂單失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  });

  // 獲取訂單統計
  fastify.get('/orders/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = querySchema.parse(request.query);
      
      // 構建查詢條件
      const where: any = {};
      
      if (query.startDate || query.endDate) {
        where.createdAt = {};
        if (query.startDate) {
          where.createdAt.gte = new Date(query.startDate);
        }
        if (query.endDate) {
          where.createdAt.lte = new Date(query.endDate);
        }
      }
      
      const [totalOrders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.orderItem.aggregate({
          where: {
            order: where
          },
        }),
        prisma.orderItem.aggregate({
          where: {
            order: where
          },
        })
      ]);
      
      return {
        success: true,
        data: {
          totalOrders,
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
} 