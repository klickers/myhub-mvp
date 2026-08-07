-- CreateTable
CREATE TABLE "DailyHighlight" (
    "date" TIMESTAMP(3) NOT NULL,
    "highlight" TEXT,

    CONSTRAINT "DailyHighlight_pkey" PRIMARY KEY ("date")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyHighlight_date_key" ON "DailyHighlight"("date");
