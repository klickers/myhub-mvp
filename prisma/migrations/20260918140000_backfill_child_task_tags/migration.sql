-- Backfill inherited task tags so existing subtasks carry their parents' tags.
WITH RECURSIVE inherited_tags AS (
    SELECT
        child."id" AS "taskId",
        parent_tag."tagId"
    FROM "Task" child
    JOIN "Task" parent_task ON parent_task."id" = child."parentTaskId"
    JOIN "TaskTag" parent_tag ON parent_tag."taskId" = parent_task."id"

    UNION

    SELECT
        child."id" AS "taskId",
        inherited_tags."tagId"
    FROM "Task" child
    JOIN inherited_tags ON inherited_tags."taskId" = child."parentTaskId"
)
INSERT INTO "TaskTag" ("taskId", "tagId")
SELECT "taskId", "tagId"
FROM inherited_tags
ON CONFLICT DO NOTHING;
