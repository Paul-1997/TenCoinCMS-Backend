import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@/lib/prisma';

export default async function healthRoutes(fastify: FastifyInstance) {
  // 基本健康檢查
  fastify.get('/health', async () => {
    return {
      success: true,
      message: '服務運行正常',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  });

  // 資料庫健康檢查
  fastify.get('/health/db', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 測試資料庫連接
      await prisma.$queryRaw`SELECT 1`;
      
      // 獲取基本統計信息
      const [productCount, orderCount] = await Promise.all([
        prisma.product.count(),
        prisma.order.count()
      ]);
      
      return {
        success: true,
        message: '資料庫連接正常',
        timestamp: new Date().toISOString(),
        stats: {
          products: productCount,
          orders: orderCount
        }
      };
    } catch (error) {
      return reply.status(503).send({
        success: false,
        message: '資料庫連接失敗',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  });

  // 完整健康檢查
  fastify.get('/health/full', async (request: FastifyRequest, reply: FastifyReply) => {
    const checks = {
      server: true,
      database: false,
      timestamp: new Date().toISOString()
    };

    try {
      // 測試資料庫連接
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      checks.database = false;
    }

    const allHealthy = checks.server && checks.database;

    if (allHealthy) {
      return {
        success: true,
        message: '所有服務運行正常',
        checks
      };
    } else {
      return reply.status(503).send({
        success: false,
        message: '部分服務異常',
        checks
      });
    }
  });
} 