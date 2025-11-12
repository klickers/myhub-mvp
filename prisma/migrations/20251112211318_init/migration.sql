-- CreateEnum
CREATE TYPE "Status" AS ENUM ('notstarted', 'archived', 'inprogress', 'onhold', 'completed');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('bucket', 'objective', 'block');

-- CreateTable
CREATE TABLE "Bucket" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Bucket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Objective" (
    "id" SERIAL NOT NULL,
    "bucketId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "status" "Status" NOT NULL DEFAULT 'notstarted',

    CONSTRAINT "Objective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "objectiveId" INTEGER NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'notstarted',
    "scheduledTime" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Week" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,

    CONSTRAINT "Week_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimePerWeek" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "itemType" "ItemType" NOT NULL DEFAULT 'objective',
    "objectiveId" INTEGER,
    "scheduledTime" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TimePerWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "itemType" "ItemType" NOT NULL DEFAULT 'objective',
    "objectiveId" INTEGER,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyValue" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "KeyValue_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "GoogleCalendarId" (
    "id" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "GoogleCalendarId_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bucket_slug_key" ON "Bucket"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Objective_slug_key" ON "Objective"("slug");

-- CreateIndex
CREATE INDEX "Block_year_weekNumber_objectiveId_idx" ON "Block"("year", "weekNumber", "objectiveId");

-- CreateIndex
CREATE UNIQUE INDEX "Week_year_weekNumber_key" ON "Week"("year", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TimePerWeek_year_weekNumber_itemType_objectiveId_key" ON "TimePerWeek"("year", "weekNumber", "itemType", "objectiveId");

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_bucketId_fkey" FOREIGN KEY ("bucketId") REFERENCES "Bucket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_year_weekNumber_fkey" FOREIGN KEY ("year", "weekNumber") REFERENCES "Week"("year", "weekNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimePerWeek" ADD CONSTRAINT "TimePerWeek_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimePerWeek" ADD CONSTRAINT "TimePerWeek_year_weekNumber_fkey" FOREIGN KEY ("year", "weekNumber") REFERENCES "Week"("year", "weekNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE SET NULL ON UPDATE CASCADE;
