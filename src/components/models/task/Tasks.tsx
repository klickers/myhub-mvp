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
	const taskIdsByEffectiveTagId = useTasksStore(
		(state) => state.taskIdsByEffectiveTagId,
	)
	const taskIdsByEffectiveTagGroupId = useTasksStore(
		(state) => state.taskIdsByEffectiveTagGroupId,
	)
	const untaggedTaskIds = useTasksStore((state) => state.untaggedTaskIds)
	const [isAddingTask, setIsAddingTask] = useState(false)

	const loadTags = useTagsStore((state) => state.loadTags)

	useEffect(() => {
		loadTasks()
		loadTags()
	}, [])

	const tasks: TaskNode[] = useMemo(() => {
		let filteredTasks = allTasks
		let allowedTaskIds: Set<number> | null = null
		if (filter.type === "untagged") {
			const untaggedIds = new Set(untaggedTaskIds)
			filteredTasks = allTasks.filter((task) => untaggedIds.has(task.id))
		} else if (filter.type === "tag")
			allowedTaskIds = new Set(taskIdsByEffectiveTagId[filter.id] ?? [])
		else if (filter.type === "group")
			allowedTaskIds = new Set(
				taskIdsByEffectiveTagGroupId[filter.id] ?? [],
			)
		const tree = buildTaskTree(
			allTasks,
			filter.type === "tag" ? filter.id : null,
			filter.type === "task" ? filter.id : null,
			filter.type === "group" ? filter.id : null,
			allowedTaskIds,
		)
		return filter.type === "task" ? (tree[0]?.subtasks ?? []) : tree
	}, [
		allTasks,
		filter,
		taskIdsByEffectiveTagGroupId,
		taskIdsByEffectiveTagId,
		untaggedTaskIds,
	])

	const evergreenTasks = useMemo(
		() => tasks.filter((task) => task.isEvergreen),
		[tasks],
	)
	const otherTasks = useMemo(() => {
		return tasks.filter((task) => !task.isEvergreen)
	}, [tasks])

	return (
		<>
			{otherTasks.length === 0 && evergreenTasks.length === 0 && (
				<>
					{/* Add task button */}
					<button
						className="button"
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
										: filter.type === "task"
											? (tasks
													.find(
														(t) =>
															t.id === filter.id,
													)
													?.tags.map(
														(tag) => tag.tagId,
													) ?? undefined)
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
							{task.notes.length != 0 && (
								<Icon
									icon="mingcute:document-line"
									className="text-indigo-700"
								/>
							)}
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
			{(otherTasks.length > 0 || evergreenTasks.length > 0) && (
				<div>
					{evergreenTasks.length > 0 && (
						<p className="font-semibold">Other Tasks</p>
					)}

					{/* Add task button */}
					<button
						className="button"
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
								{/* <th>Est. Time</th> */}
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
													: filter.type === "task"
														? (tasks
																.find(
																	(t) =>
																		t.id ===
																		filter.id,
																)
																?.tags.map(
																	(tag) =>
																		tag.tagId,
																) ?? undefined)
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
				</div>
			)}
		</>
	)
}
