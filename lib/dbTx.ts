import { prisma } from "@/lib/db";

// Helper: typed transaction wrapper zonder Prisma namespace import
export async function withTx<T>(fn: (tx: any) => Promise<T>) {
  return prisma.$transaction(async (tx: any) => fn(tx));
}
