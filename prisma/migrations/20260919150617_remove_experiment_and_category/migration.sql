/*
  Warnings:

  - The values [experiment] on the enum `SessionItemType` will be removed. If these variants are still used in the database, this will fail.
  - The values [experiment] on the enum `TaskParentType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `experimentId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `experimentId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Experiment` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SessionItemType_new" AS ENUM ('none', 'tag', 'task', 'objective');
ALTER TABLE "public"."Session" ALTER COLUMN "itemType" DROP DEFAULT;
ALTER TABLE "Session" ALTER COLUMN "itemType" TYPE "SessionItemType_new" USING ("itemType"::text::"SessionItemType_new");
ALTER TYPE "SessionItemType" RENAME TO "SessionItemType_old";
ALTER TYPE "SessionItemType_new" RENAME TO "SessionItemType";
DROP TYPE "public"."SessionItemType_old";
ALTER TABLE "Session" ALTER COLUMN "itemType" SET DEFAULT 'task';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TaskParentType_new" AS ENUM ('none', 'tag', 'task');
ALTER TABLE "public"."Task" ALTER COLUMN "parentType" DROP DEFAULT;
ALTER TABLE "Task" ALTER COLUMN "parentType" TYPE "TaskParentType_new" USING ("parentType"::text::"TaskParentType_new");
ALTER TYPE "TaskParentType" RENAME TO "TaskParentType_old";
ALTER TYPE "TaskParentType_new" RENAME TO "TaskParentType";
DROP TYPE "public"."TaskParentType_old";
ALTER TABLE "Task" ALTER COLUMN "parentType" SET DEFAULT 'task';
COMMIT;

-- DropForeignKey
ALTER TABLE "Experiment" DROP CONSTRAINT "Experiment_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_experimentId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_experimentId_fkey";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "experimentId";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "experimentId";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "Experiment";
