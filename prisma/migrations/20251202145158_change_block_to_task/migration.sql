/*
  Warnings:

  - The values [block] on the enum `ItemType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Block` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[year,weekNumber,itemType,objectiveId,taskId]` on the table `TimePerWeek` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ItemType_new" AS ENUM ('bucket', 'objective', 'task');
ALTER TABLE "public"."Session" ALTER COLUMN "itemType" DROP DEFAULT;
ALTER TABLE "public"."TimePerWeek" ALTER COLUMN "itemType" DROP DEFAULT;
ALTER TABLE "TimePerWeek" ALTER COLUMN "itemType" TYPE "ItemType_new" USING ("itemType"::text::"ItemType_new");
ALTER TABLE "Session" ALTER COLUMN "itemType" TYPE "ItemType_new" USING ("itemType"::text::"ItemType_new");
ALTER TYPE "ItemType" RENAME TO "ItemType_old";
ALTER TYPE "ItemType_new" RENAME TO "ItemType";
DROP TYPE "public"."ItemType_old";
ALTER TABLE "Session" ALTER COLUMN "itemType" SET DEFAULT 'objective';
ALTER TABLE "TimePerWeek" ALTER COLUMN "itemType" SET DEFAULT 'objective';
COMMIT;

-- DropForeignKey
ALTER TABLE "Block" DROP CONSTRAINT "Block_objectiveId_fkey";

-- DropForeignKey
ALTER TABLE "Block" DROP CONSTRAINT "Block_year_weekNumber_fkey";

-- DropIndex
DROP INDEX "TimePerWeek_year_weekNumber_itemType_objectiveId_key";

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "taskId" INTEGER;

-- AlterTable
ALTER TABLE "TimePerWeek" ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taskId" INTEGER;

-- DropTable
DROP TABLE "Block";

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "objectiveId" INTEGER NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'notstarted',
    "estimatedTime" INTEGER NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TimePerWeek_year_weekNumber_itemType_objectiveId_taskId_key" ON "TimePerWeek"("year", "weekNumber", "itemType", "objectiveId", "taskId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimePerWeek" ADD CONSTRAINT "TimePerWeek_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
