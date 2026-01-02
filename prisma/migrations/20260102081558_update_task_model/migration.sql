/*
  Warnings:

  - The `parentType` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `taskId` on the `TimePerWeek` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[year,weekNumber,itemType,objectiveId]` on the table `TimePerWeek` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "TimePerWeek" DROP CONSTRAINT "TimePerWeek_taskId_fkey";

-- DropIndex
DROP INDEX "TimePerWeek_year_weekNumber_itemType_objectiveId_taskId_key";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "parentType",
ADD COLUMN     "parentType" "TaskParentType" NOT NULL DEFAULT 'contract';

-- AlterTable
ALTER TABLE "TimePerWeek" DROP COLUMN "taskId";

-- CreateIndex
CREATE UNIQUE INDEX "TimePerWeek_year_weekNumber_itemType_objectiveId_key" ON "TimePerWeek"("year", "weekNumber", "itemType", "objectiveId");
