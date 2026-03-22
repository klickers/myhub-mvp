import type { MakeTimeType, Status, Task } from "@/generated/prisma/client"
import EditableText from "./form/EditableText"
import { actions } from "astro:actions"
import SessionPlayButton from "./models/session/SessionPlayButton"
import EditableNumber from "./form/EditableNumber"
import EditableMakeTimeType from "./form/EditableMakeTimeType"
import EditableStatus from "./form/EditableStatus"
import EditableDate from "./form/EditableDate"
import Subtasks from "./models/task/Subtasks"

export default function SideTray({
	type,
	selected,
	setSelected,
}: {
	type: "task"
	selected: Task
	setSelected: (task: any) => void
}) {
	return (
		<>
			{/* BACKDROP */}
			<div
				className="fixed inset-0 z-40"
				onClick={() => setSelected(null)}
			/>

			{/* TRAY */}
			<div
				className="fixed right-0 top-0 h-screen w-1/2 bg-white shadow-lg p-6 z-50 overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex justify-between items-start mb-6">
					<div className="flex items-center gap-1">
						<EditableText
							value={selected.name}
							onSave={async (name) => {
								const updated = await actions.task.update({
									id: selected.id,
									name,
								})
								setSelected((s) => (s ? { ...s, name } : s))
							}}
							className="text-xl font-semibold"
						/>
						<SessionPlayButton
							itemType={type}
							itemId={selected.id}
						/>
					</div>
					<button
						onClick={() => setSelected(null)}
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
									value={selected.estimatedTime}
									onSave={async (v) => {
										const updated =
											await actions.task.update({
												id: selected.id,
												estimatedTime: v ?? undefined,
											})
										setSelected((s) =>
											s
												? {
														...s,
														estimatedTime: v,
													}
												: s,
										)
									}}
								/>
							</td>
						</tr>
						<tr>
							<td className="pr-4 text-gray-600">
								Make Time Type
							</td>
							<td>
								<EditableMakeTimeType
									value={
										selected.makeTimeType as MakeTimeType
									}
									onSave={async (makeTimeType) => {
										const updated =
											await actions.task.update({
												id: selected.id,
												makeTimeType,
											})
										setSelected((s) =>
											s ? { ...s, makeTimeType } : s,
										)
									}}
								/>
							</td>
						</tr>
						<tr>
							<td className="pr-4 text-gray-600">Status</td>
							<td>
								<EditableStatus
									value={selected.status as Status}
									onSave={async (status) => {
										const updated =
											await actions.task.update({
												id: selected.id,
												status,
											})
										setSelected((s) =>
											s ? { ...s, status } : s,
										)
									}}
								/>
							</td>
						</tr>
						<tr>
							<td className="pr-4 text-gray-600">Deadline</td>
							<td>
								<EditableDate
									value={
										selected.deadline
											? selected.deadline.toISOString()
											: null
									}
									onSave={async (date) => {
										const d = date ? new Date(date) : null
										await actions.task.update({
											id: selected.id,
											deadline: d,
										})
										setSelected((s) =>
											s ? { ...s, deadline: d } : s,
										)
									}}
								/>
							</td>
						</tr>
					</tbody>
				</table>

				<Subtasks taskId={selected.id} />

				{/* TODO: add past sessions, add notes area? */}
			</div>
		</>
	)
}
