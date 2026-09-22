import { useState } from "react"
import { toast } from "react-toastify"

import type { TaskWithTags } from "@/types/prisma-custom"
import { useTasksStore } from "@/stores/tasks"

type Props = {
	parentId?: number | undefined
	tags?: number[] | undefined
	onCreated?: (task: TaskWithTags) => void
}

export default function TaskCreateForm({
	parentId = undefined,
	tags = undefined,
	onCreated,
}: Props) {
	const [name, setName] = useState("")
	const createTask = useTasksStore((state) => state.createTask)

	async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" && name) {
			await createTask({
				name,
				parentTaskId: parentId,
				tags,
			})
				.then((data) => {
					if (data) {
						toast.success(`Created task "${name}" successfully!`)
						onCreated?.(data)
						setName("")
					}
				})
				.catch((error) => {
					toast.error(
						`Failed to create task "${name}": ${error.message}`,
					)
				})
		}
	}

	return (
		<input
			type="text"
			placeholder="New task"
			autoFocus
			className="py-0 w-full"
			value={name}
			onKeyDown={handleKeyDown}
			onChange={(e) => setName(e.target.value)}
		/>
	)
}
