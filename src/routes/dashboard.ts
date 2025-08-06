import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '@/services/productService';
import { sendSuccess, sendError } from '@/utils/response';

const productService = new ProductService();

export default async function dashboardRoutes(fastify: FastifyInstance) {
  // 獲取儀表板統計資料
  fastify.get('/dashboard/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await productService.getDashboardStats();
      sendSuccess(reply, stats);
    } catch (error) {
      sendError(reply, error instanceof Error ? error.message : 'Failed to get dashboard stats');
    }
  });
} 