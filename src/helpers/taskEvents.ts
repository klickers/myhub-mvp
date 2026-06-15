import type { Task } from "@/generated/prisma/client"

export const TASK_UPDATED_EVENT = "myhub:task-updated"
export const TASK_REMOVED_EVENT = "myhub:task-removed"

export type TaskUpdatedEvent = CustomEvent<{
	task: Task
}>

export type TaskRemovedEvent = CustomEvent<{
	taskIds: number[]
}>

export function dispatchTaskUpdated(task: Task) {
	if (typeof window === "undefined") return

	window.dispatchEvent(
		new CustomEvent(TASK_UPDATED_EVENT, {
			detail: { task },
		}),
	)
}

export function dispatchTaskRemoved(taskIds: number[]) {
	if (typeof window === "undefined") return

	window.dispatchEvent(
		new CustomEvent(TASK_REMOVED_EVENT, {
			detail: { taskIds },
		}),
	)
}
