import { prisma } from "@/lib/db";

// Helper: typed transaction wrapper zonder Prisma namespace import
export async function withTx<T>(fn: (tx: Parameters<typeof prisma.$transaction>[0] extends (arg: infer A) => any ? A : never) => Promise<T>) {
  // Prisma overloads zijn lastig; deze call zorgt dat TS de callback overload pakt
  return prisma.$transaction(async (tx: any) => fn(tx));
}