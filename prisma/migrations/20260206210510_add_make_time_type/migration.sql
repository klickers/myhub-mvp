-- CreateEnum
CREATE TYPE "MakeTimeType" AS ENUM ('highlight', 'batch');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "makeTimeType" "MakeTimeType";
