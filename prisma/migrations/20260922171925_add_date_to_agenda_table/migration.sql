/*
  Warnings:

  - Added the required column `date` to the `Agenda` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Agenda" ADD COLUMN     "date" TIMESTAMP(3) NOT NULL;

-- DropEnum
DROP TYPE "AgendaItemType";
