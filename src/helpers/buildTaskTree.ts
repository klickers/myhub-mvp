import type { Prisma } from "@/generated/prisma/client"

type TaskWithTags = Prisma.TaskGetPayload<{
	include: {
		tags: {
			select: {
				tagId: true
			}
		}
	}
}>

export type TaskNode = TaskWithTags & {
	subtasks: TaskNode[]
}

function statusQualifies(status: TaskWithTags["status"]) {
	return (
		status !== "archived" && status !== "completed" && status !== "onhold"
	)
}

export default function buildTaskTree(
	tasks: TaskWithTags[],
	tagId: number,
): TaskNode[] {
	const map = new Map<number, TaskNode>()

	// Create nodes
	for (const task of tasks) {
		map.set(task.id, {
			...task,
			subtasks: [],
		})
	}

	// Connect all valid tasks to their parents
	for (const task of map.values()) {
		if (!task.parentTaskId) continue
		const parent = map.get(task.parentTaskId)
		if (parent && statusQualifies(task.status)) parent.subtasks.push(task)
	}

	// Find tasks directly containing this tag
	const taggedIds = new Set(
		tasks
			.filter((task) => task.tags.some((tag) => tag.tagId === tagId))
			.map((task) => task.id),
	)

	// Keep only tagged tasks that don't have a tagged ancestor
	return [...taggedIds]
		.filter((id) => {
			let parentId = map.get(id)?.parentTaskId
			while (parentId) {
				if (taggedIds.has(parentId)) return false
				parentId = map.get(parentId)?.parentTaskId
			}
			return true
		})
		.map((id) => map.get(id)!)
		.filter((task) => statusQualifies(task.status))
}
