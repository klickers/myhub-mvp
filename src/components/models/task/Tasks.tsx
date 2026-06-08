import { useEffect, useState } from "react"
import { format } from "date-fns"
import SessionPlayButton from "@/components/models/session/SessionPlayButton"
import type { Task } from "@/generated/prisma/client"
import { Status } from "@/generated/prisma/enums"
import {
	TASK_UPDATED_EVENT,
	type TaskUpdatedEvent,
} from "@/helpers/taskEvents"
import { Icon } from "@iconify/react"
import minutesToHours from "@/helpers/time/minutesToHours"
import SideTray from "@/components/SideTray"

type TaskListTask = Task & {
	subtasks?: Task[]
}

type TaskParentFilter =
	| { parentType: "contract"; parentId: number }
	| { parentType: "experiment"; parentId: number }
	| { parentType: "guild"; parentId: number }
	| { parentType?: never; parentId?: never }

type Props = TaskParentFilter & {
	tasks: TaskListTask[]
	statuses?: Status[]
}

function taskBelongsToParent(task: Task, parentFilter: TaskParentFilter) {
	if (!parentFilter.parentType) return true
	if (parentFilter.parentType === "contract") {
		return task.contractId === parentFilter.parentId
	}
	if (parentFilter.parentType === "experiment") {
		return task.experimentId === parentFilter.parentId
	}
	return task.guildId === parentFilter.parentId
}

function taskMatchesStatuses(task: Task, statuses?: Status[]) {
	return !statuses || statuses.includes(task.status)
}

function sortTasks(tasks: TaskListTask[]) {
	return tasks.slice().sort((a, b) => {
		if (!a.deadline && !b.deadline) return a.name.localeCompare(b.name)
		if (!a.deadline) return 1
		if (!b.deadline) return -1

		const deadlineOrder =
			new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
		if (deadlineOrder !== 0) return deadlineOrder

		return a.name.localeCompare(b.name)
	})
}

export default function Tasks({
	tasks,
	statuses,
	parentType,
	parentId,
}: Props) {
	const [taskList, setTaskList] = useState<TaskListTask[]>(() => tasks)
	const [selectedTask, setSelectedTask] = useState<Task | null>(null)
	const parentFilter = { parentType, parentId } as TaskParentFilter

	// keep local copy in sync if tasks prop changes
	useEffect(() => {
		setTaskList(tasks)
		setSelectedTask((currentTask) => {
			if (!currentTask) return currentTask
			return (
				tasks.find((candidate) => candidate.id === currentTask.id) ??
				currentTask
			)
		})
	}, [tasks])

	useEffect(() => {
		const handleTaskUpdated = (event: Event) => {
			const { task } = (event as TaskUpdatedEvent).detail
			const shouldInclude =
				taskBelongsToParent(task, parentFilter) &&
				taskMatchesStatuses(task, statuses)

			setTaskList((currentTasks) => {
				const existingTask = currentTasks.find(
					(candidate) => candidate.id === task.id,
				)

				if (!shouldInclude) {
					return existingTask
						? currentTasks.filter((candidate) => candidate.id !== task.id)
						: currentTasks
				}

				const nextTask = existingTask
					? { ...existingTask, ...task }
					: task
				const nextTasks = existingTask
					? currentTasks.map((candidate) =>
							candidate.id === task.id ? nextTask : candidate,
						)
					: [...currentTasks, nextTask]

				return sortTasks(nextTasks)
			})
		}

		window.addEventListener(TASK_UPDATED_EVENT, handleTaskUpdated)
		return () =>
			window.removeEventListener(TASK_UPDATED_EVENT, handleTaskUpdated)
	}, [parentId, parentType, statuses])

	return (
		<div>
			{/* TASK LIST */}
			<div className="space-y-1">
				{taskList.map((task) => {
					let completed = 0,
						total = 0
					if (task.subtasks) {
						for (const subtask of task.subtasks) {
							if (subtask.status === "archived") continue
							total++
							if (subtask.status === "completed") completed++
						}
					}
					return (
						<div
							key={task.id}
							className={`card ${
								task.status === "completed"
									? "bg-green-50 border-green-50"
									: task.status === "inprogress"
										? "bg-yellow-50"
										: ""
							}`}
						>
							<div className="card__content p-2">
								<div className="flex justify-between items-center">
									<div
										className="flex gap-4 items-center cursor-pointer"
										onClick={() => setSelectedTask(task)}
									>
										<p className="font-semibold">
											{task.name}
										</p>
										{task.subtasks &&
											task.subtasks.length > 0 && (
												<p className="text-xs text-gray-600 flex items-center gap-1">
													<Icon icon="mingcute:list-check-2-line" />
													<span>
														{completed}/{total}
													</span>
												</p>
											)}
										{task.estimatedTime &&
										task.estimatedTime != 0 ? (
											<p className="text-xs text-gray-600 flex items-center gap-1">
												<Icon icon="mingcute:time-line" />{" "}
												{minutesToHours(
													task.estimatedTime,
												)}
												h
											</p>
										) : null}
									</div>
									<div className="flex items-center gap-2 -mr-1">
										{task.deadline && (
											<p className="text-xs text-gray-600 flex items-center gap-1">
												<span className="-mt-0.5">
													<Icon icon="mingcute:calendar-fill" />
												</span>
												{format(
													new Date(task.deadline),
													"MMM dd, yyyy",
												)}
											</p>
										)}
										<SessionPlayButton
											itemType="task"
											itemId={task.id}
										/>
									</div>
								</div>
							</div>
						</div>
					)
				})}
			</div>

			{/* SIDE TRAY */}
			{selectedTask && (
				<SideTray
					type="task"
					selected={selectedTask}
					setSelected={setSelectedTask}
				/>
			)}
		</div>
	)
}
