import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import type { D1Database } from "@cloudflare/workers-types";

function getClient(): PrismaClient {
  const { env } = getCloudflareContext() as unknown as { env: { DB: D1Database } };
  return new PrismaClient({ adapter: new PrismaD1(env.DB) });
}

function modelProxy(model: string) {
  return new Proxy({}, {
    get(_target, method: string) {
      return (...args: unknown[]) => (getClient() as any)[model][method](...args);
    },
  });
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property: string) {
    if (property === "$transaction" || property === "$queryRaw" || property === "$executeRaw") {
      return (...args: unknown[]) => (getClient() as any)[property](...args);
    }
    return modelProxy(property);
  },
});
