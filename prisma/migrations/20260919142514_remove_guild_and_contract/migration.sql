/*
  Warnings:

  - The values [guild,contract] on the enum `SessionItemType` will be removed. If these variants are still used in the database, this will fail.
  - The values [contract,guild] on the enum `TaskParentType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `contractId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `guildId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `contractId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `guildId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `Contract` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Guild` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SessionItemType_new" AS ENUM ('none', 'tag', 'task', 'experiment', 'objective');
ALTER TABLE "public"."Session" ALTER COLUMN "itemType" DROP DEFAULT;
ALTER TABLE "Session" ALTER COLUMN "itemType" TYPE "SessionItemType_new" USING ("itemType"::text::"SessionItemType_new");
ALTER TYPE "SessionItemType" RENAME TO "SessionItemType_old";
ALTER TYPE "SessionItemType_new" RENAME TO "SessionItemType";
DROP TYPE "public"."SessionItemType_old";
ALTER TABLE "Session" ALTER COLUMN "itemType" SET DEFAULT 'task';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TaskParentType_new" AS ENUM ('none', 'tag', 'task', 'experiment');
ALTER TABLE "public"."Task" ALTER COLUMN "parentType" DROP DEFAULT;
ALTER TABLE "Task" ALTER COLUMN "parentType" TYPE "TaskParentType_new" USING ("parentType"::text::"TaskParentType_new");
ALTER TYPE "TaskParentType" RENAME TO "TaskParentType_old";
ALTER TYPE "TaskParentType_new" RENAME TO "TaskParentType";
DROP TYPE "public"."TaskParentType_old";
ALTER TABLE "Task" ALTER COLUMN "parentType" SET DEFAULT 'task';
COMMIT;

-- DropForeignKey
ALTER TABLE "Contract" DROP CONSTRAINT "Contract_guildId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_contractId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_guildId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_contractId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_guildId_fkey";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "contractId",
DROP COLUMN "guildId";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "contractId",
DROP COLUMN "guildId",
ALTER COLUMN "parentType" SET DEFAULT 'task';

-- DropTable
DROP TABLE "Contract";

-- DropTable
DROP TABLE "Guild";
