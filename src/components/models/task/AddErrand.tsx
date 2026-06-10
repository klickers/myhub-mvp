import { actions } from "astro:actions"
import { Icon } from "@iconify/react"
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
				type="button"
				onClick={() => setOpen(true)}
				className="inline-flex size-7 items-center justify-center rounded-md border border-gray-300/70 bg-white/65 text-gray-600 shadow-sm transition-colors duration-150 hover:bg-white hover:text-gray-950 focus-visible:outline-none"
				aria-label="Add errand"
				title="Add errand"
			>
				<Icon icon="mingcute:add-line" className="size-4" />
			</button>
		)
	}

	return (
		<div className="w-full">
			<input
				ref={ref}
				value={name}
				onChange={(e) => setName(e.target.value)}
				onBlur={create}
				onKeyDown={(e) => {
					if (e.key === "Enter") create()
					if (e.key === "Escape") setOpen(false)
				}}
				placeholder="New errand..."
				className="w-full rounded-md border border-gray-300/80 bg-white/85 px-2 py-1 text-sm shadow-sm transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-gray-400 focus:border-gray-500 focus:bg-white focus:outline-none"
			/>
		</div>
	)
}
