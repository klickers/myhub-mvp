/*
  Warnings:

  - The `itemType` column on the `Session` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SessionItemType" AS ENUM ('objective', 'none', 'guild', 'contract', 'experiment', 'task');

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "contractId" INTEGER,
ADD COLUMN     "experimentId" INTEGER,
ADD COLUMN     "guildId" INTEGER,
DROP COLUMN "itemType",
ADD COLUMN     "itemType" "SessionItemType" NOT NULL DEFAULT 'objective';

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
