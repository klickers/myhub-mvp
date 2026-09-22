import type { Status } from "@/generated/prisma/enums"
import type { TaskWithTags, TaskNode } from "@/types/prisma-custom"

// TODO: cache tree at some point
// TODO: full load no tags option

function statusQualifies(status: Status) {
	return (
		status !== "archived" && status !== "completed" && status !== "onhold"
	)
}

export default function buildTaskTree(
	tasks: TaskWithTags[],
	tagId: number | null = null,
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

	if (tagId !== null) {
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
	} else {
		return [...map.values()].filter(
			(task) => !task.parentTaskId && statusQualifies(task.status),
		)
	}
}
