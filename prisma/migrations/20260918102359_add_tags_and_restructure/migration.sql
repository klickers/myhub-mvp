/*
  Warnings:

  - The values [guild,contract,category,experiment] on the enum `AgendaItemType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `personaId` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the `Persona` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TagType" AS ENUM ('group', 'tag', 'subgroup');

-- AlterEnum
BEGIN;
CREATE TYPE "AgendaItemType_new" AS ENUM ('none', 'tag', 'task');
ALTER TYPE "AgendaItemType" RENAME TO "AgendaItemType_old";
ALTER TYPE "AgendaItemType_new" RENAME TO "AgendaItemType";
DROP TYPE "public"."AgendaItemType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "SessionItemType" ADD VALUE 'tag';

-- AlterEnum
ALTER TYPE "TaskParentType" ADD VALUE 'tag';

-- DropForeignKey
ALTER TABLE "Guild" DROP CONSTRAINT "Guild_personaId_fkey";

-- AlterTable
ALTER TABLE "Agenda" ADD COLUMN     "description" TEXT,
ADD COLUMN     "scheduledTime" INTEGER DEFAULT 0,
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'notstarted',
ADD COLUMN     "tagId" INTEGER,
ADD COLUMN     "taskId" INTEGER;

-- AlterTable
ALTER TABLE "Guild" DROP COLUMN "personaId";

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "agendaId" INTEGER,
ADD COLUMN     "tagId" INTEGER;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "showSubtasks" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tagId" INTEGER;

-- DropTable
DROP TABLE "Persona";

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "TagType" NOT NULL,
    "order" INTEGER NOT NULL,
    "visibility" BOOLEAN NOT NULL DEFAULT true,
    "parentId" INTEGER,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agenda" ADD CONSTRAINT "Agenda_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agenda" ADD CONSTRAINT "Agenda_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "Agenda"("id") ON DELETE SET NULL ON UPDATE CASCADE;
