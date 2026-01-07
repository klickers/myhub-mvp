import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { actions } from "astro:actions"

type TaskNode = {
	id: number
	name: string
	parentTaskId: number | null
	children: TaskNode[]
}

function cx(...parts: Array<string | false | null | undefined>) {
	return parts.filter(Boolean).join(" ")
}

export default function Subtasks({ taskId }: { taskId: number }) {
	const [tree, setTree] = useState<TaskNode[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const reload = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const res = await actions.task.subtaskTreeByTaskId({ taskId })
			setTree(res.data?.tree ?? [])
		} catch (e: any) {
			setError(e?.message ?? "Failed to load subtasks")
		} finally {
			setLoading(false)
		}
	}, [taskId])

	useEffect(() => {
		void reload()
	}, [reload])

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<div className="text-sm text-gray-600">
					{loading ? "Loading…" : null}
					{error ? (
						<span className="text-red-600">{error}</span>
					) : null}
				</div>
				<AddInline
					parentTaskId={taskId}
					onAdded={reload}
				/>
			</div>

			{tree.length === 0 && !loading ? (
				<div className="text-sm text-gray-500">No subtasks yet.</div>
			) : null}

			<div className="space-y-1">
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
	onChange: () => void
}) {
	const [editing, setEditing] = useState(false)
	const [draft, setDraft] = useState(node.name)
	const inputRef = useRef<HTMLInputElement | null>(null)

	useEffect(() => {
		setDraft(node.name)
	}, [node.name])

	useEffect(() => {
		if (editing) inputRef.current?.focus()
	}, [editing])

	const save = useCallback(async () => {
		const next = draft.trim()
		if (!next || next === node.name) {
			setEditing(false)
			setDraft(node.name)
			return
		}
		await actions.task.updateName({ id: node.id, name: next })
		setEditing(false)
		onChange()
	}, [draft, node.id, node.name, onChange])

	return (
		<div className="space-y-1">
			<div
				className={cx(
					"flex items-center gap-2 text-sm",
					depth > 0 && "pl-3 border-l border-gray-200"
				)}
				style={{ marginLeft: depth === 0 ? 0 : 8 }}
			>
				{editing ? (
					<input
						ref={inputRef}
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						onBlur={() => void save()}
						onKeyDown={(e) => {
							if (e.key === "Enter") void save()
							if (e.key === "Escape") {
								setEditing(false)
								setDraft(node.name)
							}
						}}
						className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
					/>
				) : (
					<button
						type="button"
						onClick={() => setEditing(true)}
						className="flex-1 text-left hover:underline"
						title="Click to rename"
					>
						{node.name}
					</button>
				)}

				<AddInline
					parentTaskId={node.id}
					onAdded={onChange}
				/>
			</div>

			{node.children?.length ? (
				<div className="space-y-1">
					{node.children.map((child) => (
						<Node
							key={child.id}
							node={child}
							depth={depth + 1}
							onChange={onChange}
						/>
					))}
				</div>
			) : null}
		</div>
	)
}

function AddInline({
	parentTaskId,
	onAdded,
}: {
	parentTaskId: number
	onAdded: () => void
}) {
	const [open, setOpen] = useState(false)
	const [name, setName] = useState("")
	const [saving, setSaving] = useState(false)
	const inputRef = useRef<HTMLInputElement | null>(null)

	useEffect(() => {
		if (open) inputRef.current?.focus()
	}, [open])

	const create = useCallback(async () => {
		const next = name.trim()
		if (!next) return
		setSaving(true)
		try {
			await actions.task.createSubtask({ parentTaskId, name: next })
			setName("")
			setOpen(false)
			onAdded()
		} finally {
			setSaving(false)
		}
	}, [name, onAdded, parentTaskId])

	if (!open) {
		return (
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="text-xs text-gray-600 hover:underline"
				title="Add subtask"
			>
				+ subtask
			</button>
		)
	}

	return (
		<div className="flex items-center gap-2">
			<input
				ref={inputRef}
				value={name}
				onChange={(e) => setName(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") void create()
					if (e.key === "Escape") {
						setOpen(false)
						setName("")
					}
				}}
				placeholder="New subtask…"
				className="w-40 rounded border border-gray-200 px-2 py-1 text-xs"
			/>
			<button
				type="button"
				onClick={() => void create()}
				disabled={saving}
				className="text-xs text-gray-700 hover:underline disabled:opacity-50"
			>
				Add
			</button>
		</div>
	)
}
