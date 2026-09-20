import { useState } from "react"
import { Icon } from "@iconify/react"
import CreateTaskForm from "./CreateTaskForm"
import type { TaskNode } from "@/helpers/buildTaskTree"
import Task from "@/components/models/task/Task"
import type { TagWithChildren } from "@/types/prisma-custom"

interface Props {
	tasks: TaskNode[]
	tags: TagWithChildren[]
	currentTag?: TagWithChildren | null
}

export default function Tasks({ tasks, tags, currentTag }: Props) {
	const [allTasks, setAllTasks] = useState(tasks)
	const [isAddingTask, setIsAddingTask] = useState(false)

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
							<td className="max-w-[400px]">
								<CreateTaskForm
									tags={
										currentTag ? [currentTag.id] : undefined
									}
									onCreated={(newTask) => {
										setAllTasks((prev) => [
											...prev,
											{ ...newTask, subtasks: [] },
										])
										setIsAddingTask(false)
									}}
								/>
							</td>
						</tr>
					)}
					<Task
						tasks={allTasks}
						depth={0}
						tags={tags}
						updateTasks={setAllTasks}
					/>
				</tbody>
			</table>
		</>
	)
}
