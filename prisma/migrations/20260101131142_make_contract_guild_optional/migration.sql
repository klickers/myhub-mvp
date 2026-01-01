/*
  Warnings:

  - You are about to drop the column `objectiveId` on the `Task` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AgendaItemType" AS ENUM ('guild', 'contract', 'task', 'category', 'experiment');

-- CreateEnum
CREATE TYPE "TaskParentType" AS ENUM ('none', 'contract', 'experiment', 'task');

-- DropForeignKey
ALTER TABLE "Contract" DROP CONSTRAINT "Contract_guildId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_objectiveId_fkey";

-- AlterTable
ALTER TABLE "Contract" ALTER COLUMN "guildId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "objectiveId",
ADD COLUMN     "parentType" "ItemType" NOT NULL DEFAULT 'objective';

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experiment" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "Status" NOT NULL DEFAULT 'inprogress',
    "categoryId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agenda" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "Agenda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Experiment_slug_key" ON "Experiment"("slug");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experiment" ADD CONSTRAINT "Experiment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
