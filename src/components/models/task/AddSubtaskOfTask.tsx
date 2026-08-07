import { actions } from "astro:actions"
import { Check, Plus, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

export default function AddSubtaskOfTask({
	parentTaskId,
	onAdded,
	label = "New subtask",
	compact = false,
}: {
	parentTaskId: number
	onAdded: () => void
	label?: string
	compact?: boolean
}) {
	const [open, setOpen] = useState(false)
	const [name, setName] = useState("")
	const [saving, setSaving] = useState(false)
	const ref = useRef<HTMLInputElement | null>(null)

	useEffect(() => {
		if (open) ref.current?.focus()
	}, [open])

	const create = async () => {
		const nextName = name.trim()
		if (!nextName || saving) return
		setSaving(true)

		try {
			await actions.task.createSubtask({
				name: nextName,
				parentTaskId,
			})
			setName("")
			setOpen(false)
			onAdded()
		} finally {
			setSaving(false)
		}
	}

	const cancel = () => {
		setName("")
		setOpen(false)
	}

	if (!open) {
		return (
			<button
				type="button"
				onClick={() => setOpen(true)}
				className={
					compact
						? "inline-flex size-7 flex-none items-center justify-center rounded-md border border-gray-300/70 bg-white/65 text-gray-500 shadow-sm transition-colors hover:bg-white hover:text-gray-950 focus-visible:outline-none"
						: "inline-flex min-h-8 items-center gap-1.5 rounded-md border border-gray-300/70 bg-white/70 px-2.5 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-white hover:text-gray-950 focus-visible:outline-none"
				}
				aria-label={label}
			>
				<Plus
					className="size-3.5"
					aria-hidden="true"
				/>
				{!compact && <span>{label}</span>}
			</button>
		)
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				void create()
			}}
			className={
				compact
					? "inline-flex w-56 max-w-full items-center gap-1"
					: "flex w-full items-center gap-1.5"
			}
		>
			<input
				ref={ref}
				value={name}
				onChange={(e) => setName(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Escape") cancel()
				}}
				placeholder="New subtask..."
				className="min-h-8 flex-1 rounded-md border border-gray-300/70 bg-white/80 px-2.5 text-xs shadow-sm transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-gray-400 focus:border-gray-500 focus:bg-white focus:outline-none"
			/>
			<button
				type="submit"
				disabled={!name.trim() || saving}
				className="inline-flex size-8 flex-none items-center justify-center rounded-md border border-gray-300/70 bg-gray-900 text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-200 disabled:text-gray-400 focus-visible:outline-none"
				aria-label="Add subtask"
			>
				<Check
					className="size-3.5"
					aria-hidden="true"
				/>
			</button>
			<button
				type="button"
				onClick={cancel}
				className="inline-flex size-8 flex-none items-center justify-center rounded-md border border-gray-300/70 bg-white/70 text-gray-500 shadow-sm transition-colors hover:bg-white hover:text-gray-950 focus-visible:outline-none"
				aria-label="Cancel subtask"
			>
				<X
					className="size-3.5"
					aria-hidden="true"
				/>
			</button>
		</form>
	)
}
