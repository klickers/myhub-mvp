import React from "react"
import { format } from "date-fns"
import { Icon } from "@iconify/react"
import { toast } from "react-toastify"
import { actions } from "astro:actions"
import type { TaskNode } from "@/helpers/buildTaskTree"
import EditableText from "@/components/form/EditableText"

interface Props {
	initialTasks: TaskNode[]
	depth?: number
}

export default function Task({ initialTasks, depth = 0 }: Props) {
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
							<span>{task.status}</span>
						</td>
						<td className="font-mono text-right">
							<span>{task.estimatedTime}</span>
						</td>
						<td className="font-mono text-right">
							<span>
								{task.deadline &&
									format(task.deadline, "MM/dd/yy")}
							</span>
						</td>
						<td>
							<span>
								{task.tags.map((tag, index) => (
									<span
										className="mr-1"
										key={tag.tag.id}
									>
										{tag.tag.name +
											(index < task.tags.length - 1
												? ","
												: "")}
									</span>
								))}
							</span>
						</td>
						<td>
							<span className="flex gap-2 justify-end">
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
						/>
					)}
				</React.Fragment>
			))}
		</>
	)
}
