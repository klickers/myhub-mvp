import { useEffect, useState } from "react"
import { format } from "date-fns"
import { actions } from "astro:actions"
import Subtasks from "./Subtasks"
import SessionPlayButton from "@/components/models/session/SessionPlayButton"
import type { Status, Task } from "@/generated/prisma/client"
import EditableDate from "@/components/form/EditableDate"
import EditableStatus from "@/components/form/EditableStatus"
import EditableNumber from "@/components/form/EditableNumber"
import EditableText from "@/components/form/EditableText"
import { Icon } from "@iconify/react"

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
			<div className="space-y-2">
				{tasks.map((task) => {
					let completed = 0,
						total = 0
					for (const subtask of task.subtasks) {
						if (subtask.status === "archived") continue
						total++
						if (subtask.status === "completed") completed++
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
							<div className="card__content">
								<div className="flex justify-between items-center">
									<div
										className="flex gap-4 items-center cursor-pointer"
										onClick={() => setSelectedTask(task)}
									>
										<p className="font-semibold">
											{task.name}
										</p>
										{task.subtasks.length > 0 && (
											<p className="text-xs text-gray-600 flex items-center gap-1">
												<Icon icon="mingcute:list-check-2-line" />
												<span>
													{completed}/{total}
												</span>
											</p>
										)}
									</div>
									<div className="flex items-center gap-2 -mr-1">
										{task.deadline && (
											<p className="text-xs text-gray-600">
												Due{" "}
												{format(
													task.deadline,
													"MMM d, yyyy"
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
				<>
					{/* BACKDROP */}
					<div
						className="fixed inset-0 z-40"
						onClick={() => setSelectedTask(null)}
					/>

					{/* TRAY */}
					<div
						className="fixed right-0 top-0 h-screen w-2/5 bg-white shadow-lg p-6 z-50 overflow-y-auto"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex justify-between items-start mb-6">
							<div className="flex items-center gap-1">
								<EditableText
									value={selectedTask.name}
									onSave={async (name) => {
										const updated =
											await actions.task.update({
												id: selectedTask.id,
												name,
											})
										setSelectedTask((t) =>
											t ? { ...t, name } : t
										)
									}}
									className="text-xl font-semibold"
								/>
								<SessionPlayButton
									itemType="task"
									itemId={selectedTask.id}
								/>
							</div>
							<button
								onClick={() => setSelectedTask(null)}
								className="text-sm text-gray-500 hover:underline"
							>
								Close
							</button>
						</div>

						<table className="text-sm mb-8 leading-relaxed">
							<tbody className="space-y-2">
								<tr>
									<td className="pr-4 text-gray-600">
										Estimated Time
									</td>
									<td>
										<EditableNumber
											value={selectedTask.estimatedTime}
											onSave={async (v) => {
												const updated =
													await actions.task.update({
														id: selectedTask.id,
														estimatedTime:
															v ?? undefined,
													})
												setSelectedTask((t) =>
													t
														? {
																...t,
																estimatedTime:
																	v,
														  }
														: t
												)
											}}
										/>
									</td>
								</tr>
								<tr>
									<td className="pr-4 text-gray-600">
										Status
									</td>
									<td>
										<EditableStatus
											value={
												selectedTask.status as Status
											}
											onSave={async (status) => {
												const updated =
													await actions.task.update({
														id: selectedTask.id,
														status,
													})
												setSelectedTask((t) =>
													t ? { ...t, status } : t
												)
											}}
										/>
									</td>
								</tr>
								<tr>
									<td className="pr-4 text-gray-600">
										Deadline
									</td>
									<td>
										<EditableDate
											value={
												selectedTask.deadline
													? selectedTask.deadline.toISOString()
													: null
											}
											onSave={async (date) => {
												const d = date
													? new Date(date)
													: null
												await actions.task.update({
													id: selectedTask.id,
													deadline: d,
												})
												setSelectedTask((t) =>
													t
														? { ...t, deadline: d }
														: t
												)
											}}
										/>
									</td>
								</tr>
							</tbody>
						</table>

						<Subtasks taskId={selectedTask.id} />

						{/* TODO: add past sessions */}
					</div>
				</>
			)}
		</div>
	)
}
