import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';

// 載入環境變數
dotenv.config();

// 路由
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import healthRoutes from './routes/health';
import dashboardRoutes from './routes/dashboard';  // 新增

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// 初始化函數
async function initializeApp() {
  // 註冊 CORS
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com', 'https://app.yourdomain.com'] // 替換為您的實際域名
      : true,
    credentials: true,
  });

  // 註冊 Swagger
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'TenCoin CMS API',
        description: '雜貨店管理系統 API 文件',
        version: '1.0.0',
      },
      host: process.env.API_HOST || 'localhost:3000',
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        next();
      },
      preHandler: function (request, reply, next) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });

  // 註冊路由
  await fastify.register(healthRoutes, { prefix: '/api/v1' });
  await fastify.register(productRoutes, { prefix: '/api/v1' });
  await fastify.register(orderRoutes, { prefix: '/api/v1' });
  await fastify.register(dashboardRoutes, { prefix: '/api/v1' });  // 新增
}

// 根端點
fastify.get('/', async () => {
  return {
    message: 'TenCoin CMS API',
    version: '1.0.0',
    docs: '/docs',
    health: '/api/v1/health',
    endpoints: {
      products: '/api/v1/products',
      orders: '/api/v1/orders',
      health: '/api/v1/health',
      dashboard: '/api/v1/dashboard'  // 新增
    }
  };
});

// 錯誤處理
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: 'Validation error',
      details: error.validation,
    });
  }
  
  return reply.status(500).send({
    success: false,
    error: 'Internal server error',
  });
});

// 啟動伺服器
const start = async () => {
  try {
    // 初始化應用
    await initializeApp();
    
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    
    console.log(`🚀 Server is running on http://${host}:${port}`);
    console.log(`📚 API Documentation: http://${host}:${port}/docs`);
    console.log(`💚 Health Check: http://${host}:${port}/api/v1/health`);
    console.log(`🔗 Database Health: http://${host}:${port}/api/v1/health/db`);
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();