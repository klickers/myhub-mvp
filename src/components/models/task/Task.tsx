import React from "react"
import { Icon } from "@iconify/react"
import { toast } from "react-toastify"
import { actions } from "astro:actions"
import type { TaskNode } from "@/types/prisma-custom"
import EditableText from "@/components/form/EditableText"
import EditableStatus from "@/components/form/EditableStatus"
import EditableNumber from "@/components/form/EditableNumber"
import EditableDate from "@/components/form/EditableDate"
import { dateKeyToUtcDate, getUtcDateKey } from "@/helpers/dateOnly"
import SessionPlayButton from "../session/SessionPlayButton"
import EditableTags from "@/components/form/EditableTags"
import CreateTaskForm from "./CreateTaskForm"
import { useTasksStore } from "@/stores/tasks"
import { useTagsStore } from "@/stores/tags"

interface Props {
	tasks: TaskNode[]
	depth?: number
}

export default function Task({ tasks, depth = 0 }: Props) {
	const updateTask = useTasksStore((state) => state.updateTask)
	const [addTaskParentId, setAddTaskParentId] = React.useState<number | null>(
		null,
	)
	const openSideTray = useTasksStore((state) => state.openSideTray)
	const saveTaskChange = async (
		patch: Parameters<typeof actions.task.update>[0],
	) => {
		const res = await updateTask(patch.id, patch)
		if (res === undefined) toast.error("Failed to update task")
		else toast.success("Task updated successfully")
	}

	const tags = useTagsStore((state) => state.tags)

	return (
		<>
			{/* Task rows */}
			{tasks.map((task) => (
				<React.Fragment key={task.id}>
					<tr
						className={
							"task border-b border-gray-200" +
							(task.status === "inprogress"
								? " bg-yellow-50 hover:bg-yellow-100"
								: task.status === "completed"
									? " bg-green-50 hover:bg-green-100"
									: " hover:bg-gray-100")
						}
					>
						<td
							className={
								"max-w-[400px]" +
								(depth == 0 ? " font-medium" : "")
							}
							style={{ paddingLeft: depth + "rem" }}
						>
							<EditableText
								value={task.name}
								onSave={(name) =>
									saveTaskChange({ id: task.id, name })
								}
							/>
						</td>
						<td>
							<span className="flex items-center gap-1">
								<SessionPlayButton
									itemType="task"
									itemId={task.id}
								/>
								<button
									className="text-blue-400 hover:text-blue-600"
									onClick={() => openSideTray(task.id)}
								>
									<Icon icon="mingcute:pencil-3-fill" />
								</button>
							</span>
						</td>
						<td>
							<EditableStatus
								value={task.status}
								onSave={(status) =>
									saveTaskChange({ id: task.id, status })
								}
								className="p-0 -ml-1 text-xs bg-transparent border-0"
							/>
						</td>
						<td className="font-mono text-right">
							{/* TODO: hide if evergreen */}
							<EditableNumber
								value={task.estimatedTime}
								onSave={(estimatedTime) =>
									saveTaskChange({
										id: task.id,
										estimatedTime,
									})
								}
								className="px-1 py-0 w-12 bg-transparent"
							/>
						</td>
						<td className="font-mono text-right">
							<EditableDate
								value={
									task.deadline &&
									getUtcDateKey(task.deadline)
								}
								onSave={(deadline) =>
									saveTaskChange({
										id: task.id,
										deadline: deadline
											? dateKeyToUtcDate(deadline)
											: null,
									})
								}
							/>
						</td>
						<td>
							<EditableTags
								value={task.tags.map((tag) => tag.tag)}
								tags={tags}
								onSave={(tags) =>
									saveTaskChange({
										id: task.id,
										tags: tags.map((tag) => tag.id),
									})
								}
							/>
						</td>
						<td className="pr-0">
							<button className="text-red-300 hover:text-red-500">
								<Icon icon="mingcute:delete-2-fill" />
							</button>
						</td>
						<button
							className="button-add-subtask"
							style={{ left: depth + 0.75 + "rem" }}
							onClick={() =>
								setAddTaskParentId((current) =>
									current === task.id ? null : task.id,
								)
							}
						>
							{addTaskParentId === task.id ? (
								<Icon icon="mingcute:minimize-fill" />
							) : (
								<Icon icon="mingcute:add-fill" />
							)}
						</button>
					</tr>

					{/* Subtask rows */}
					{task.subtasks.length > 0 && (
						<Task
							key={task.id + "-subtasks"}
							tasks={task.subtasks}
							depth={depth + 1}
						/>
					)}

					{/* Add subtask button */}
					{addTaskParentId === task.id && (
						<tr>
							<td
								className="max-w-[400px]"
								style={{
									paddingLeft: depth + 1 + "rem",
								}}
							>
								<CreateTaskForm
									parentId={task.id}
									tags={task.tags.map((tag) => tag.tag.id)}
									onCreated={() => setAddTaskParentId(null)}
								/>
							</td>
						</tr>
					)}
				</React.Fragment>
			))}
		</>
	)
}
