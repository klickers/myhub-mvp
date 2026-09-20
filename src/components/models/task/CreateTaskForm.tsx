import { useState } from "react"
import { toast } from "react-toastify"

import { actions } from "astro:actions"
import type { TaskWithTags } from "@/types/prisma-custom"

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

	async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" && name) {
			const { data, error } = await actions.task.create({
				name,
				parentType: parentId ? "task" : "none",
				parentTaskId: parentId,
				tags,
			})
			if (error) {
				toast.error(`Failed to create task "${name}": ${error.message}`)
			} else {
				toast.success(`Created task "${name}" successfully!`)
				onCreated?.(data)
				setName("")
			}
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
