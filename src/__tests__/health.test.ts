import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';
import Fastify from 'fastify';
import healthRoutes from '../routes/health';

const fastify = Fastify();

describe('健康檢查測試', () => {
  beforeAll(async () => {
    await fastify.register(healthRoutes, { prefix: '/api/v1' });
    await fastify.listen({ port: 0 });
  });

  afterAll(async () => {
    await fastify.close();
    await prisma.$disconnect();
  });

  it('應該返回基本健康檢查狀態', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    expect(response.statusCode).toBe(200);
    
    const result = JSON.parse(response.payload);
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('message', '服務運行正常');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('uptime');
    expect(typeof result.uptime).toBe('number');
  });

  it('應該返回資料庫健康檢查狀態', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/health/db',
    });

    expect(response.statusCode).toBe(200);
    
    const result = JSON.parse(response.payload);
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('message', '資料庫連接正常');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('stats');
    expect(result.stats).toHaveProperty('products');
    expect(result.stats).toHaveProperty('orders');
    expect(typeof result.stats.products).toBe('number');
    expect(typeof result.stats.orders).toBe('number');
  });

  it('應該返回完整健康檢查狀態', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/health/full',
    });

    expect(response.statusCode).toBe(200);
    
    const result = JSON.parse(response.payload);
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('message', '所有服務運行正常');
    expect(result).toHaveProperty('checks');
    expect(result.checks).toHaveProperty('server', true);
    expect(result.checks).toHaveProperty('database');
    expect(result.checks).toHaveProperty('timestamp');
  });
}); 