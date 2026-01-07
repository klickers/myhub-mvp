import { useCallback, useEffect, useRef, useState } from "react"
import { actions } from "astro:actions"
import type { Status } from "@/generated/prisma/enums"
import EditableDate from "@/components/form/EditableDate"
import EditableStatus from "@/components/form/EditableStatus"
import EditableNumber from "@/components/form/EditableNumber"
import EditableText from "@/components/form/EditableText"

type TaskNode = {
	id: number
	name: string
	status: Status
	estimatedTime: number | null
	deadline: string | null
	parentTaskId: number | null
	children: TaskNode[]
}

/* -------------------------------------------------------
   Root
------------------------------------------------------- */

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

	return (
		<div className="space-y-2">
			<div className="flex justify-between items-center">
				{loading ? (
					<span className="text-sm text-gray-500">"Loading…"</span>
				) : (
					<h3 className="text-lg font-semibold mb-3">Subtasks</h3>
				)}
				<AddSubtask
					parentTaskId={taskId}
					onAdded={reload}
				/>
			</div>

			{tree.length === 0 && !loading ? (
				<p className="text-sm text-gray-500">No subtasks yet.</p>
			) : null}

			<div className="space-y-2">
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

/* -------------------------------------------------------
   Recursive Node
------------------------------------------------------- */

function Node({
	node,
	depth,
	onChange,
}: {
	node: TaskNode
	depth: number
	onChange: () => void
}) {
	return (
		<div className="space-y-1">
			<div
				className="flex items-center gap-3 text-sm"
				style={{ marginLeft: depth * 12 }}
			>
				<EditableText
					value={node.name}
					onSave={(name) =>
						actions.task
							.update({ id: node.id, name })
							.then(onChange)
					}
				/>
				<EditableStatus
					value={node.status}
					onSave={(status) =>
						actions.task
							.update({ id: node.id, status })
							.then(onChange)
					}
				/>
				<EditableNumber
					value={node.estimatedTime}
					onSave={(v) =>
						actions.task
							.update({
								id: node.id,
								estimatedTime: v ?? undefined,
							})
							.then(onChange)
					}
				/>
				<EditableDate
					value={node.deadline ? node.deadline.toISOString() : null}
					onSave={(date) =>
						actions.task
							.update({
								id: node.id,
								deadline: date ? new Date(date) : null,
							})
							.then(onChange)
					}
				/>
				<AddSubtask
					parentTaskId={node.id}
					onAdded={onChange}
				/>
			</div>

			{node.children.map((child) => (
				<Node
					key={child.id}
					node={child}
					depth={depth + 1}
					onChange={onChange}
				/>
			))}
		</div>
	)
}

/* -------------------------------------------------------
   Add Subtask
------------------------------------------------------- */

function AddSubtask({
	parentTaskId,
	onAdded,
}: {
	parentTaskId: number
	onAdded: () => void
}) {
	const [open, setOpen] = useState(false)
	const [name, setName] = useState("")
	const ref = useRef<HTMLInputElement | null>(null)

	useEffect(() => {
		if (open) ref.current?.focus()
	}, [open])

	const create = async () => {
		if (!name.trim()) return
		await actions.task.create({
			name,
			parentType: "task",
			parentTaskId,
		})
		setName("")
		setOpen(false)
		onAdded()
	}

	if (!open) {
		return (
			<button
				onClick={() => setOpen(true)}
				className="text-xs text-gray-500 hover:underline"
			>
				+
			</button>
		)
	}

	return (
		<input
			ref={ref}
			value={name}
			onChange={(e) => setName(e.target.value)}
			onBlur={create}
			onKeyDown={(e) => {
				if (e.key === "Enter") create()
				if (e.key === "Escape") setOpen(false)
			}}
			placeholder="New subtask…"
			className="border px-1 text-xs"
		/>
	)
}
