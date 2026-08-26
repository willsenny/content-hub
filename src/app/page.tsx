import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  let dbStatus: string;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch {
    dbStatus = "error";
  }

  return (
    <main>
      <h1>Content Hub</h1>
      <p>Phase 1 — Prisma 客户端就绪</p>
      <p>数据库：{dbStatus}</p>
    </main>
  );
}
