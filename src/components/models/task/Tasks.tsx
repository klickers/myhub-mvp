import { useEffect, useState, useMemo } from "react"
import { Icon } from "@iconify/react"
import CreateTaskForm from "./CreateTaskForm"
import type { TaskNode } from "@/types/prisma-custom"
import Task from "@/components/models/task/Task"
import { useTasksStore } from "@/stores/tasks"
import { useTagsStore } from "@/stores/tags"
import buildTaskTree from "@/helpers/buildTaskTree"
import SideTray from "@/components/SideTray"

type TasksFilter =
	| { type: "all" }
	| { type: "untagged" }
	| { type: "tag"; id: number }

interface Props {
	filter: TasksFilter
}

export default function Tasks({ filter }: Props) {
	const loadTasks = useTasksStore((state) => state.loadTasks)
	const allTasks = useTasksStore((state) => state.tasks)
	const [isAddingTask, setIsAddingTask] = useState(false)
	const [selectedTask, setSelectedTask] = useState<number | null>(null)

	const loadTags = useTagsStore((state) => state.loadTags)

	useEffect(() => {
		loadTasks()
		loadTags()
	}, [])

	const tasks: TaskNode[] = useMemo(() => {
		let filteredTasks = allTasks
		if (filter.type === "untagged")
			filteredTasks = allTasks.filter((task) => task.tags.length === 0)
		return buildTaskTree(
			filteredTasks,
			filter.type === "tag" ? filter.id : null,
		)
	}, [allTasks, filter])

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
						{/* Controls */}
						<th></th>
						<th>Status</th>
						<th>Est. Time</th>
						<th>Deadline</th>
						<th>Tags</th>
						{/* Delete */}
						<th className="pr-0"></th>
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
										filter.type === "tag"
											? [filter.id]
											: undefined
									}
									onCreated={() => setIsAddingTask(false)}
								/>
							</td>
						</tr>
					)}
					<Task
						tasks={tasks}
						depth={0}
						onClick={(task) => setSelectedTask(task.id)}
					/>
				</tbody>
			</table>

			{/* Side tray */}
			{selectedTask && (
				<SideTray
					type="task"
					taskId={selectedTask}
					setSelected={setSelectedTask}
				/>
			)}
		</>
	)
}
