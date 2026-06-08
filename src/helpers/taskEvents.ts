import type { Task } from "@/generated/prisma/client"

export const TASK_UPDATED_EVENT = "myhub:task-updated"

export type TaskUpdatedEvent = CustomEvent<{
	task: Task
}>

export function dispatchTaskUpdated(task: Task) {
	if (typeof window === "undefined") return

	window.dispatchEvent(
		new CustomEvent(TASK_UPDATED_EVENT, {
			detail: { task },
		}),
	)
}
