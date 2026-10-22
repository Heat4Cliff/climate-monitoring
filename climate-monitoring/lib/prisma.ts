import { PrismaClient } from '@prisma/client'

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString()
}

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
