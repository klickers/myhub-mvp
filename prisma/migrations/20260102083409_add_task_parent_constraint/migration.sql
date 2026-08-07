-- AlterTable
ALTER TABLE "Task"
ADD CONSTRAINT task_has_single_parent CHECK (
  ("contractId" IS NOT NULL AND "experimentId" IS NULL AND "parentTaskId" IS NULL)
  OR ("contractId" IS NULL AND "experimentId" IS NOT NULL AND "parentTaskId" IS NULL)
  OR ("contractId" IS NULL AND "experimentId" IS NULL AND "parentTaskId" IS NOT NULL)
  OR ("contractId" IS NULL AND "experimentId" IS NULL AND "parentTaskId" IS NULL)
);