import { useEffect, useState } from "react"
import { format } from "date-fns"
import SessionPlayButton from "@/components/models/session/SessionPlayButton"
import type { Task } from "@/generated/prisma/client"
import { Icon } from "@iconify/react"
import minutesToHours from "@/helpers/time/minutesToHours"
import SideTray from "@/components/SideTray"

export default function Tasks({ tasks }: { tasks: Task[] }) {
	const [selectedTask, setSelectedTask] = useState<Task | null>(null)

	// keep local copy in sync if tasks prop changes
	useEffect(() => {
		if (!selectedTask) return
		const fresh = tasks.find((t) => t.id === selectedTask.id)
		if (fresh) setSelectedTask(fresh)
	}, [tasks])

	return (
		<div>
			{/* TASK LIST */}
			<div className="space-y-1">
				{tasks.map((task) => {
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
