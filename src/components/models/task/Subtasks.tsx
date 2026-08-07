import { useCallback, useEffect, useState } from "react"
import { actions } from "astro:actions"
import type { MakeTimeType, Status } from "@/generated/prisma/enums"
import {
	TASK_REMOVED_EVENT,
	dispatchTaskUpdated,
} from "@/helpers/taskEvents"
import EditableDate from "@/components/form/EditableDate"
import EditableStatus from "@/components/form/EditableStatus"
import EditableNumber from "@/components/form/EditableNumber"
import EditableText from "@/components/form/EditableText"
import SessionPlayButton from "@/components/models/session/SessionPlayButton"
import AddSubtaskOfTask from "./AddSubtaskOfTask"
import EditableMakeTimeType from "@/components/form/EditableMakeTimeType"
import TaskDeleteButton from "@/components/models/task/TaskDeleteButton"

type TaskNode = {
	id: number
	name: string
	makeTimeType: MakeTimeType | null
	status: Status
	estimatedTime: number | null
	deadline: Date | string | null
	parentTaskId: number | null
	children: TaskNode[]
}

export default function Subtasks({ taskId }: { taskId: number }) {
	const [tree, setTree] = useState<TaskNode[]>([])
	const [loading, setLoading] = useState(false)

	const reload = useCallback(async () => {
		setLoading(true)
		const res = await actions.task.subtaskTreeByTaskId({ taskId })
		setTree(res.data?.tree ?? [])
		setLoading(false)
	}, [taskId])

	useEffect(() => {
		void reload()
	}, [reload])

	useEffect(() => {
		const handleTaskRemoved = () => {
			void reload()
		}

		window.addEventListener(TASK_REMOVED_EVENT, handleTaskRemoved)
		return () =>
			window.removeEventListener(TASK_REMOVED_EVENT, handleTaskRemoved)
	}, [reload])

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					<h3 className="mb-0 text-base font-semibold text-gray-950">
						Subtasks
					</h3>
					{loading && (
						<span className="text-xs font-medium text-gray-500">
							Loading...
						</span>
					)}
				</div>
				<AddSubtaskOfTask
					parentTaskId={taskId}
					onAdded={reload}
					label="Add subtask"
				/>
			</div>

			{tree.length === 0 && !loading ? (
				<div className="rounded-md border border-dashed border-gray-300/80 bg-white/45 px-3 py-4 text-sm text-gray-500">
					No subtasks yet.
				</div>
			) : null}

			<div className="space-y-1.5">
				{tree.map((node) => (
					<Node
						key={node.id}
						node={node}
						depth={0}
						onChange={reload}
					/>
				))}
			</div>
		</div>
	)
}

function Node({
	node,
	depth,
	onChange,
}: {
	node: TaskNode
	depth: number
	onChange: () => void | Promise<void>
}) {
	const statusStyle = getStatusStyle(node.status)
	const deadlineValue = getDateValue(node.deadline)

	const saveTaskChange = async (
		patch: Parameters<typeof actions.task.update>[0],
	) => {
		const res = await actions.task.update(patch)
		if (res.data) dispatchTaskUpdated(res.data)
		await onChange()
	}

	return (
		<div className="space-y-1.5">
			<div
				className={`group rounded-md border px-3 py-2 shadow-sm transition-colors ${statusStyle.row}`}
				style={{ marginLeft: depth * 14 }}
			>
				<div className="flex flex-wrap items-center gap-2">
					<div className="min-w-48 flex-1">
						<EditableText
							value={node.name}
							onSave={(name) =>
								saveTaskChange({ id: node.id, name })
							}
							className={`w-full rounded-md px-1 py-0.5 text-sm font-semibold leading-snug text-gray-900 hover:bg-white/65 hover:no-underline ${
								node.status === "completed"
									? "line-through decoration-gray-400"
									: ""
							}`}
							inputClassName="bg-white/90 text-sm"
						/>
					</div>
					<span
						className={`rounded-full px-2 py-0.5 text-[0.68rem] font-semibold uppercase leading-none ${statusStyle.badge}`}
					>
						{statusLabel(node.status)}
					</span>
					<div className="ml-auto inline-flex items-center gap-1.5">
						<SessionPlayButton
							itemType="task"
							itemId={node.id}
						/>
						<TaskDeleteButton
							taskId={node.id}
							taskName={node.name}
							className="size-7"
						/>
						<AddSubtaskOfTask
							parentTaskId={node.id}
							onAdded={onChange}
							label="Add nested subtask"
							compact
						/>
					</div>
				</div>

				<div className="mt-2 flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto pb-1 text-xs text-gray-600">
					<div className="inline-flex flex-none items-center gap-1 whitespace-nowrap rounded-md bg-white/55 px-2 py-1">
						<span className="font-semibold text-gray-500">
							Type
						</span>
						<EditableMakeTimeType
							value={node.makeTimeType ?? "none"}
							onSave={(makeTimeType) =>
								saveTaskChange({
									id: node.id,
									makeTimeType,
								})
							}
						/>
					</div>
					<div className="inline-flex flex-none items-center gap-1 whitespace-nowrap rounded-md bg-white/55 px-2 py-1">
						<span className="font-semibold text-gray-500">
							Status
						</span>
						<EditableStatus
							value={node.status}
							onSave={(status) =>
								saveTaskChange({ id: node.id, status })
							}
						/>
					</div>
					<div className="inline-flex flex-none items-center gap-1 whitespace-nowrap rounded-md bg-white/55 px-2 py-1">
						<span className="font-semibold text-gray-500">
							Time
						</span>
						<EditableNumber
							value={node.estimatedTime}
							onSave={(v) =>
								saveTaskChange({
									id: node.id,
									estimatedTime: v,
								} as Parameters<
									typeof actions.task.update
								>[0] & {
									estimatedTime: number | null
								})
							}
						/>
					</div>
					<div className="inline-flex flex-none items-center gap-1 whitespace-nowrap rounded-md bg-white/55 px-2 py-1">
						<span className="font-semibold text-gray-500">
							Due
						</span>
						<EditableDate
							value={deadlineValue}
							onSave={(date) =>
								saveTaskChange({
									id: node.id,
									deadline: date ? new Date(date) : null,
								})
							}
						/>
					</div>
				</div>
			</div>

			{node.children.length > 0 && (
				<div className="space-y-1.5 border-l border-gray-300/70 pl-2">
					{node.children.map((child) => (
						<Node
							key={child.id}
							node={child}
							depth={depth + 1}
							onChange={onChange}
						/>
					))}
				</div>
			)}
		</div>
	)
}

function getDateValue(value: Date | string | null) {
	if (!value) return null
	const date = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(date.getTime())) return null
	return date.toISOString()
}

function statusLabel(status: Status) {
	switch (status) {
		case "notstarted":
			return "Not started"
		case "inprogress":
			return "In progress"
		case "onhold":
			return "On hold"
		case "completed":
			return "Done"
		case "archived":
			return "Archived"
		default:
			return status
	}
}

function getStatusStyle(status: Status) {
	switch (status) {
		case "completed":
			return {
				row: "border-emerald-200/90 bg-emerald-50/80",
				badge: "bg-emerald-100 text-emerald-800",
			}
		case "inprogress":
			return {
				row: "border-yellow-200/90 bg-yellow-50/80",
				badge: "bg-yellow-100 text-yellow-800",
			}
		case "onhold":
			return {
				row: "border-gray-300/90 bg-gray-100/75",
				badge: "bg-gray-200 text-gray-700",
			}
		case "archived":
			return {
				row: "border-gray-200 bg-white/45 opacity-70",
				badge: "bg-gray-100 text-gray-500",
			}
		default:
			return {
				row: "border-gray-300/70 bg-white/65",
				badge: "bg-gray-100 text-gray-700",
			}
	}
}
