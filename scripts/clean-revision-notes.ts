import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PREFIX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z[｜|]?/;

async function main() {
  const chapters = await prisma.novelChapter.findMany({
    where: { revisionNote: { not: null } },
    select: { id: true, revisionNote: true },
  });

  let cleaned = 0;
  for (const c of chapters) {
    const value = c.revisionNote?.trim();
    if (!value) continue;
    const stripped = value.replace(PREFIX, "");
    if (stripped !== value) {
      await prisma.novelChapter.update({
        where: { id: c.id },
        data: { revisionNote: stripped || null },
      });
      cleaned++;
    }
  }

  console.log(`清理完成，共处理 ${cleaned} 条带时间戳前缀的异常数据`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
