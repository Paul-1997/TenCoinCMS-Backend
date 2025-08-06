import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var globalPrisma: PrismaClient | undefined;
}

export const prisma = globalThis.globalPrisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.globalPrisma = prisma;
} 