import { actions } from "astro:actions"
import { useEffect, useRef, useState } from "react"

export default function AddErrand({ onAdded }: { onAdded: () => void }) {
	const [open, setOpen] = useState(false)
	const [name, setName] = useState("")
	const ref = useRef<HTMLInputElement | null>(null)

	useEffect(() => {
		if (open) ref.current?.focus()
	}, [open])

	const create = async () => {
		if (!name.trim()) return
		await actions.task.createErrand({
			name,
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
			placeholder="New errand…"
			className="border px-1 text-xs"
		/>
	)
}
