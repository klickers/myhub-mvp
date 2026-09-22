import { useEffect, useState, useMemo } from "react"
import { Icon } from "@iconify/react"
import CreateTaskForm from "./CreateTaskForm"
import type { TaskNode } from "@/types/prisma-custom"
import Task from "@/components/models/task/Task"
import type { TagWithChildren } from "@/types/prisma-custom"
import { useTasksStore } from "@/stores/tasks"
import buildTaskTree from "@/helpers/buildTaskTree"

interface Props {
	filter:
		| { type: "all" }
		| { type: "untagged" }
		| { type: "tag"; slug: string }
	tags: TagWithChildren[]
	currentTag?: TagWithChildren | null
}

export default function Tasks({ filter, tags, currentTag }: Props) {
	const loadTasks = useTasksStore((state) => state.loadTasks)
	const allTasks = useTasksStore((state) => state.tasks)
	const [isAddingTask, setIsAddingTask] = useState(false)

	useEffect(() => {
		loadTasks()
	}, [])

	const tasks: TaskNode[] = useMemo(() => {
		let filteredTasks = allTasks
		if (filter.type === "tag" && currentTag)
			filteredTasks = allTasks.filter((task) =>
				task.tags.some((tag) => tag.tagId === currentTag.id),
			)
		else if (filter.type === "untagged")
			filteredTasks = allTasks.filter((task) => task.tags.length === 0)
		return buildTaskTree(filteredTasks, currentTag?.id ?? null)
	}, [allTasks, filter.type, currentTag?.id])

	return (
		<>
			{/* Add task button */}
			<button
				className="text-xs px-1 rounded-3xl border border-gray-400"
				onClick={() => setIsAddingTask(!isAddingTask)}
			>
				{isAddingTask ? (
					<span className="flex items-center gap-1">
						<Icon icon="mingcute:minimize-fill" />
						Cancel
					</span>
				) : (
					<span className="flex items-center gap-1">
						<Icon icon="mingcute:add-fill" />
						Add Task
					</span>
				)}
			</button>

			{/* All tasks */}
			<table>
				<thead>
					<tr>
						<th>Task</th>
						<th>Status</th>
						<th>Est. Time</th>
						<th>Deadline</th>
						<th>Tags</th>
						{/* Controls */}
						<th></th>
					</tr>
				</thead>
				<tbody>
					{/* Add task section */}
					{isAddingTask && (
						<tr>
							<td
								className="max-w-[400px]"
								colSpan={5}
							>
								<CreateTaskForm
									tags={
										currentTag ? [currentTag.id] : undefined
									}
									onCreated={() => setIsAddingTask(false)}
								/>
							</td>
						</tr>
					)}
					<Task
						tasks={tasks}
						depth={0}
						tags={tags}
					/>
				</tbody>
			</table>
		</>
	)
}
