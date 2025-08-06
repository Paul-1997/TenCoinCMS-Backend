import { Order } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CreateOrderRequest, UpdateOrderRequest, OrderQueryParams, CreateOrderItemRequest } from '@/types';

export class OrderService {
  async getOrders(params: OrderQueryParams = {}) {
    const {
      page = 1,
      pageSize = 20,
      startDate,
      endDate,
    } = params;

    const skip = (page - 1) * pageSize;
    
    // 建立查詢條件
    const where: any = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // 執行查詢
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  barcode: true,
                  imagePath: true,
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getOrderById(id: string): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                barcode: true,
                imagePath: true,
              },
            },
          },
        },
      },
    });
  }

  async createOrder(data: CreateOrderRequest): Promise<Order> {
    // 驗證產品是否存在
    const productIds = data.items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sellPrice: true },
    });

    if (products.length !== productIds.length) {
      throw new Error('Some products not found');
    }

    // 建立訂單和訂單項目
    return prisma.order.create({
      data: {
        note: data.note ?? null,
        items: {
          create: data.items.map(item => {
            return {
              product: {  
                connect: {
                  id: item.productId,
                },
              },
              quantity: item.quantity,
            };
          }),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                barcode: true,
                imagePath: true,
              },
            },
          },
        },
      },
    });
  }

  async updateOrder(id: string, data: UpdateOrderRequest): Promise<Order> {
    const existingOrder = await this.getOrderById(id);
    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // 如果更新項目，需要重新建立所有項目
    if (data.items) {
      // 驗證產品是否存在
      const productIds = data.items.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, sellPrice: true },
      });

      if (products.length !== productIds.length) {
        throw new Error('Some products not found');
      }

      // 使用事務來確保資料一致性
      return prisma.$transaction(async (tx) => {
        // 刪除現有項目
        await tx.orderItem.deleteMany({
          where: { orderId: id },
        });

        // 更新訂單
        const updatedOrder = await tx.order.update({
          where: { id },
          data: {
            note: data.note ?? null,
            items: {
              create: (data.items as CreateOrderItemRequest[]).map(item => {
                return {
                  product: {
                    connect: {
                      id: item.productId,
                    },
                  },
                  quantity: item.quantity,
                };
              }),
            },
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    barcode: true,
                    imagePath: true,
                  },
                },
              },
            },
          },
        });

        return updatedOrder;
      });
    } else {
      // 只更新備註
      return prisma.order.update({
        where: { id },
        data: { note: data.note ?? null },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  barcode: true,
                  imagePath: true,
                },
              },
            },
          },
        },
      });
    }
  }

  async deleteOrder(id: string): Promise<void> {
    const existingOrder = await this.getOrderById(id);
    if (!existingOrder) {
      throw new Error('Order not found');
    }

    await prisma.order.delete({
      where: { id },
    });
  }
}
