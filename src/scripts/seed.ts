import { PrismaClient, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

// 範例產品資料
const sampleProducts = [
  {
    name: '可口可樂',
    barcode: 'COKE-001',
    costPrice: 20.0,
    sellPrice: 25.0,
    imagePath: 'https://example.com/coke.jpg',
    status: 'ACTIVE' as ProductStatus,
    tags: ['飲料', '碳酸'],
    note: '經典碳酸飲料',
    vendorIds: ['01'], // 久益
  },
  {
    name: '百事可樂',
    barcode: 'PEPSI-001',
    costPrice: 18.0,
    sellPrice: 23.0,
    imagePath: 'https://example.com/pepsi.jpg',
    status: 'ACTIVE' as ProductStatus,
    tags: ['飲料', '碳酸'],
    note: '清爽碳酸飲料',
    vendorIds: ['02'], // 益發
  },
  {
    name: '泡麵',
    barcode: 'NOODLE-001',
    costPrice: 12.0,
    sellPrice: 15.0,
    imagePath: 'https://example.com/noodle.jpg',
    status: 'ACTIVE' as ProductStatus,
    tags: ['食品', '速食'],
    note: '方便即食',
    vendorIds: ['03'], // 華
  },
  {
    name: '餅乾',
    barcode: 'COOKIE-001',
    costPrice: 8.0,
    sellPrice: 12.0,
    imagePath: 'https://example.com/cookie.jpg',
    status: 'OUT_OF_STOCK' as ProductStatus,
    tags: ['食品', '零食'],
    note: '香脆可口',
    vendorIds: ['05'], // 長呈
  },
  {
    name: '衛生紙',
    barcode: 'TISSUE-001',
    costPrice: 50.0,
    sellPrice: 65.0,
    imagePath: 'https://example.com/tissue.jpg',
    status: 'ACTIVE' as ProductStatus,
    tags: ['日用品', '清潔'],
    note: '柔軟舒適',
    vendorIds: ['08'], // 台利
  },
  {
    name: '牛奶',
    barcode: 'MILK-001',
    costPrice: 45.0,
    sellPrice: 55.0,
    imagePath: 'https://example.com/milk.jpg',
    status: 'ACTIVE' as ProductStatus,
    tags: ['飲料', '乳製品'],
    note: '新鮮營養',
    vendorIds: ['12'], // 博志
  },
  {
    name: '麵包',
    barcode: 'BREAD-001',
    costPrice: 15.0,
    sellPrice: 20.0,
    imagePath: 'https://example.com/bread.jpg',
    status: 'ACTIVE' as ProductStatus,
    tags: ['食品', '烘焙'],
    note: '新鮮出爐',
    vendorIds: ['15'], // 金禾
  },
  {
    name: '礦泉水',
    barcode: 'WATER-001',
    costPrice: 5.0,
    sellPrice: 8.0,
    imagePath: 'https://example.com/water.jpg',
    status: 'ACTIVE' as ProductStatus,
    tags: ['飲料', '水'],
    note: '純淨天然',
    vendorIds: ['17'], // 松果
  },
  {
    name: '巧克力',
    barcode: 'CHOCO-001',
    costPrice: 25.0,
    sellPrice: 35.0,
    imagePath: 'https://example.com/choco.jpg',
    status: 'DISCONTINUED' as ProductStatus,
    tags: ['食品', '零食'],
    note: '濃郁香醇',
    vendorIds: ['20'], // 天母
  },
];

async function main() {
  console.log('🌱 開始初始化資料庫...');

  // 建立產品 (使用 upsert 避免重複)
  console.log('📦 建立產品資料...');
  const products = await Promise.all(
    sampleProducts.map(product => {
      const { vendorIds, ...productData } = product;
      return prisma.product.upsert({
        where: { barcode: product.barcode },
        update: {
          name: product.name,
          status: product.status,
          costPrice: product.costPrice,
          sellPrice: product.sellPrice,
          imagePath: product.imagePath,
          tags: product.tags,
          vendors: vendorIds  // 直接設定陣列
        },
        create: {
          ...productData,
          costPrice: product.costPrice,
          sellPrice: product.sellPrice,
          vendors: vendorIds  // 直接設定陣列
        },
      });
    })
  );

  console.log(`✅ 已建立 ${products.length} 個產品`);

  // 建立範例訂單
  console.log('📋 建立範例訂單...');
  if (products.length >= 6) {
    await prisma.order.create({
      data: {
        note: '週末補貨訂單',
        items: {
          create: [
            {
              productId: products[0]?.id || '', // 可口可樂
              quantity: 50,
            },
            {
              productId: products[2]?.id || '', // 泡麵
              quantity: 100,
            },
          ],
        },
      },
    });

    await prisma.order.create({
      data: {
        note: '日常用品補貨',
        items: {
          create: [
            {
              productId: products[4]?.id || '', // 衛生紙
              quantity: 20,
            },
            {
              productId: products[5]?.id || '', // 牛奶
              quantity: 15,
            },
          ],
        },
      },
    });

    console.log(`✅ 已建立 2 個範例訂單`);
  }

  console.log('🎉 資料庫初始化完成！');
  console.log(`�� 統計資料：`);
  console.log(`   - 產品總數：${products.length}`);
  console.log(`   - 訂單總數：2`);
  console.log(`   - 缺貨商品：${products.filter(p => p.status === 'OUT_OF_STOCK').length}`);
  console.log(`   - 停售商品：${products.filter(p => p.status === 'DISCONTINUED').length}`);
}

main()
  .catch((error) => {
    console.error('❌ 初始化失敗:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });