-- AlterEnum
ALTER TYPE "TaskParentType" ADD VALUE 'guild';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "guildId" INTEGER;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE SET NULL ON UPDATE CASCADE;
