import { PrismaClient } from "@prisma/client";

// Evita crear múltiples instancias del cliente en desarrollo (hot reload)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
