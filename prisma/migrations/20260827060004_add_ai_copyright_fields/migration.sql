-- AlterTable
ALTER TABLE "novel_chapters" ADD COLUMN     "ai_prompt_log" TEXT,
ADD COLUMN     "content_hash" TEXT,
ADD COLUMN     "revision_note" TEXT;

-- AlterTable
ALTER TABLE "novels" ADD COLUMN     "outline_note" TEXT,
ADD COLUMN     "outline_prompt_log" TEXT;
