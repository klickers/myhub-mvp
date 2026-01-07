import { useState } from "react"
import { format } from "date-fns"
import Subtasks from "./Subtasks"
import SessionPlayButton from "@/components/models/session/SessionPlayButton"
import type { Task } from "@/generated/prisma/client"

export default function Tasks({ tasks }: { tasks: Task[] }) {
	const [selectedTask, setSelectedTask] = useState<Task | null>(null)

	return (
		<div>
			{/* TASK LIST */}
			<div className="space-y-2">
				{tasks.map((task) => (
					<div
						key={task.id}
						className={`card ${
							task.status == "completed"
								? "bg-green-50 border-green-50"
								: ""
						}`}
					>
						<div className="card__content">
							<div className="flex justify-between items-center">
								<p
									className="font-semibold cursor-pointer"
									onClick={() => setSelectedTask(task)}
								>
									{task.name}
								</p>
								<div className="flex items-center gap-2 -mr-1">
									{task.deadline ? (
										<p className="text-xs text-gray-600">
											Due{" "}
											{format(
												task.deadline,
												"MMM d, yyyy"
											)}
										</p>
									) : null}
									<SessionPlayButton
										itemType="task"
										itemId={task.id}
									/>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* SIDE TRAY */}
			{selectedTask && (
				<>
					{/* BACKDROP */}
					<div
						className="fixed inset-0 z-40"
						onClick={() => setSelectedTask(null)}
					/>

					{/* SIDE TRAY */}
					<div
						className="fixed right-0 top-0 h-screen w-2/5 bg-white shadow-lg p-6 z-50 overflow-y-auto"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex justify-between items-start mb-4">
							<h2>{selectedTask.name}</h2>
							<button
								onClick={() => setSelectedTask(null)}
								className="text-sm text-gray-500 hover:underline"
							>
								Close
							</button>
						</div>

						<table className="text-sm mb-6 leading-relaxed">
							<tbody>
								<tr>
									<td>Estimated Time</td>
									<td>{selectedTask.estimatedTime ?? "—"}</td>
								</tr>
								<tr>
									<td>Status</td>
									<td>{selectedTask.status}</td>
								</tr>
								<tr>
									<td>Deadline</td>
									<td>
										{selectedTask.deadline
											? format(
													new Date(
														selectedTask.deadline
													),
													"MMM d, yyyy"
											  )
											: "no deadline"}
									</td>
								</tr>
							</tbody>
						</table>

						<div>
							<h3 className="text-lg font-semibold mb-3">
								Subtasks
							</h3>
							<Subtasks taskId={selectedTask.id} />
						</div>
					</div>
				</>
			)}
		</div>
	)
}
