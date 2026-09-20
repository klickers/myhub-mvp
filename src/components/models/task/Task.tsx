import React from "react"
import { Icon } from "@iconify/react"
import { toast } from "react-toastify"
import { actions } from "astro:actions"
import type { TaskNode } from "@/helpers/buildTaskTree"
import EditableText from "@/components/form/EditableText"
import EditableStatus from "@/components/form/EditableStatus"
import EditableNumber from "@/components/form/EditableNumber"
import EditableDate from "@/components/form/EditableDate"
import { dateKeyToUtcDate, getUtcDateKey } from "@/helpers/dateOnly"
import SessionPlayButton from "../session/SessionPlayButton"
import EditableTags from "@/components/form/EditableTags"
import type { TagWithChildren } from "@/types/prisma-custom"

interface Props {
	initialTasks: TaskNode[]
	depth?: number
	tags: TagWithChildren[]
}

export default function Task({ initialTasks, depth = 0, tags }: Props) {
	const [tasks, setTasks] = React.useState(initialTasks)

	const saveTaskChange = async (
		patch: Parameters<typeof actions.task.update>[0],
	) => {
		const res = await actions.task.update(patch)
		if (res.error) toast.error("Failed to update task")
		else {
			toast.success("Task updated successfully")
			setTasks((prev) =>
				prev.map((t) => (t.id === patch.id ? { ...t, ...patch } : t)),
			)
		}
	}

	return (
		<>
			{tasks.map((task) => (
				<React.Fragment key={task.id}>
					<tr
						className={
							"border-b border-gray-200" +
							(task.status === "inprogress"
								? " bg-yellow-50 hover:bg-yellow-100"
								: " hover:bg-gray-100")
						}
					>
						<td
							className={
								"pl-" +
								depth * 4 +
								" max-w-[400px]" +
								(depth == 0 && " font-medium")
							}
						>
							<EditableText
								value={task.name}
								onSave={(name) =>
									saveTaskChange({ id: task.id, name })
								}
							/>
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
							<span>
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
							</span>
						</td>
						<td>
							<span className="flex gap-2 justify-end">
								<SessionPlayButton
									itemType="task"
									itemId={task.id}
								/>
								<button className="text-blue-400 hover:text-blue-600">
									<Icon icon="mingcute:pencil-3-fill" />
								</button>
								<button className="text-red-300 hover:text-red-500">
									<Icon icon="mingcute:delete-2-fill" />
								</button>
							</span>
						</td>
					</tr>
					{task.subtasks.length > 0 && (
						<Task
							initialTasks={task.subtasks}
							depth={depth + 1}
							tags={tags}
						/>
					)}
				</React.Fragment>
			))}
		</>
	)
}
