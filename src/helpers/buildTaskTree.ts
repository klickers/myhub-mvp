import type { Status } from "@/generated/prisma/enums"
import type { TaskWithTags, TaskNode } from "@/types/prisma-custom"


function statusQualifies(status: Status) {
	return (
		status !== "archived" && status !== "completed" && status !== "onhold"
	)
}

function compareTasks(a: TaskNode, b: TaskNode) {
	if (a.isEvergreen !== b.isEvergreen) return a.isEvergreen ? -1 : 1
	if (!a.deadline && !b.deadline) return a.name.localeCompare(b.name)
	if (!a.deadline) return 1
	if (!b.deadline) return -1
	return a.deadline.getTime() - b.deadline.getTime()
}

export default function buildTaskTree(
	tasks: TaskWithTags[],
	tagId: number | null = null,
	taskId: number | null = null,
	tagGroupId: number | null = null,
	allowedTaskIds: Set<number> | null = null,
): TaskNode[] {
	const map = new Map<number, TaskNode>()

	// Create nodes
	for (const task of tasks) {
		map.set(task.id, {
			...task,
			agendas: [...task.agendas],
			tags: [...task.tags],
			subtasks: [],
		})
	}

	// Connect all valid tasks to their parents
	for (const task of map.values()) {
		if (!task.parentTaskId || task.parentTaskId === task.id) continue
		if (allowedTaskIds && !allowedTaskIds.has(task.id)) continue
		const parent = map.get(task.parentTaskId)
		if (
			parent &&
			statusQualifies(task.status) &&
			(!allowedTaskIds || allowedTaskIds.has(parent.id))
		) {
			parent.subtasks.push(task)
			parent.subtasks.sort((a, b) => compareTasks(a, b))
			parent.agendas.push(...task.agendas)
		}
	}

	if (tagId !== null || tagGroupId !== null) {
		// Find tasks directly containing this tag
		const taggedIds =
			allowedTaskIds ??
			new Set(
				tasks
					.filter((task) =>
						task.tags.some((tag) =>
							tagId !== null
								? tag.tagId === tagId
								: tag.tag.parentId === tagGroupId,
						),
					)
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
			.sort((a, b) =>
				a.isEvergreen === b.isEvergreen ? 0 : a.isEvergreen ? -1 : 1,
			)
	}

	if (taskId !== null) {
		// Find the task with the given ID
		const task = map.get(taskId)
		return !task
			? []
			: [
					{
						...task,
						subtasks: task.subtasks.sort((a, b) =>
							compareTasks(a, b),
						),
					},
				]
	}

	return [...map.values()]
		.filter((task) => !task.parentTaskId && statusQualifies(task.status))
		.sort((a, b) => compareTasks(a, b))
}
