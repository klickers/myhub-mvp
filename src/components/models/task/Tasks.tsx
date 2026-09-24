import { useEffect, useState, useMemo } from "react"
import { Icon } from "@iconify/react"
import CreateTaskForm from "./CreateTaskForm"
import type { TaskNode } from "@/types/prisma-custom"
import Task from "@/components/models/task/Task"
import SideTrayOpenButton from "@/components/SideTrayOpenButton"
import EditableText from "@/components/form/EditableText"
import { useTasksStore } from "@/stores/tasks"
import { useTagsStore } from "@/stores/tags"
import buildTaskTree from "@/helpers/buildTaskTree"
import saveTaskChange from "@/helpers/saveTaskChange"

type TasksFilter =
	| { type: "all" }
	| { type: "untagged" }
	| { type: "tag"; id: number }
	| { type: "task"; id: number }
	| { type: "group"; id: number }

interface Props {
	filter: TasksFilter
}

export default function Tasks({ filter }: Props) {
	const openSideTray = useTasksStore((state) => state.openSideTray)
	const loadTasks = useTasksStore((state) => state.loadTasks)
	const allTasks = useTasksStore((state) => state.tasks)
	const [isAddingTask, setIsAddingTask] = useState(false)
	const [evergreenTasks, setEvergreenTasks] = useState<TaskNode[]>([])
	const [otherTasks, setOtherTasks] = useState<TaskNode[]>([])

	const loadTags = useTagsStore((state) => state.loadTags)

	useEffect(() => {
		loadTasks()
		loadTags()
	}, [])

	const tasks: TaskNode[] = useMemo(() => {
		let filteredTasks = allTasks
		if (filter.type === "untagged")
			filteredTasks = allTasks.filter((task) => task.tags.length === 0)
		const tree = buildTaskTree(
			filteredTasks,
			filter.type === "tag" ? filter.id : null,
			filter.type === "task" ? filter.id : null,
			filter.type === "group" ? filter.id : null,
		)
		return filter.type === "task" ? tree[0].subtasks : tree
	}, [allTasks, filter])

	useMemo(() => {
		setEvergreenTasks(tasks.filter((task) => task.isEvergreen))
		setOtherTasks(tasks.filter((task) => !task.isEvergreen))
	}, [tasks])

	return (
		<>
			{otherTasks.length === 0 && (
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
					{/* Add task section */}
					{isAddingTask && (
						<div>
							<CreateTaskForm
								parentId={
									filter.type === "task"
										? filter.id
										: undefined
								}
								tags={
									filter.type === "tag"
										? [filter.id]
										: undefined
								}
								onCreated={() => setIsAddingTask(false)}
							/>
						</div>
					)}
				</>
			)}

			{/* Evergreen tasks */}
			<div className="space-y-6 mb-6">
				{evergreenTasks.map((task) => (
					<div key={task.id}>
						<div className="flex items-center gap-1">
							<EditableText
								value={task.name}
								onSave={(name) =>
									saveTaskChange({ id: task.id, name })
								}
								className="w-auto text-base font-semibold"
							/>
							<SideTrayOpenButton
								onClick={() => openSideTray(task.id)}
							/>
						</div>
						<table>
							{task.subtasks.map((subtask) => (
								<Task
									key={subtask.id}
									task={subtask}
									depth={0}
								/>
							))}
						</table>
					</div>
				))}
			</div>

			{/* Non-evergreen tasks */}
			{otherTasks.length > 0 && (
				<>
					{evergreenTasks.length > 0 && (
						<p className="font-semibold">Other Tasks</p>
					)}

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
									<td colSpan={6}>
										<CreateTaskForm
											parentId={
												filter.type === "task"
													? filter.id
													: undefined
											}
											tags={
												filter.type === "tag"
													? [filter.id]
													: undefined
											}
											onCreated={() =>
												setIsAddingTask(false)
											}
										/>
									</td>
								</tr>
							)}

							{/* Task rows */}
							{otherTasks.map((task) => (
								<Task
									key={task.id}
									task={task}
									depth={0}
								/>
							))}
						</tbody>
					</table>
				</>
			)}
		</>
	)
}
