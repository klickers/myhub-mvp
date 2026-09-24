import { toast } from "react-toastify"
import { actions } from "astro:actions"
import { useTasksStore } from "@/stores/tasks"

export default async function saveTaskChange(
	patch: Parameters<typeof actions.task.update>[0],
) {
	const updateTask = useTasksStore.getState().updateTask

	const res = await updateTask(patch.id, patch)
	if (res === undefined) toast.error("Failed to update task")
	else toast.success("Task updated successfully")
}
