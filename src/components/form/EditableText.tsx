import { useEffect, useRef, useState } from "react"

export default function EditableText({
	value,
	onSave,
	className,
}: {
	value: string
	onSave: (v: string) => Promise<void>
	className?: string
}) {
	const [editing, setEditing] = useState(false)
	const [draft, setDraft] = useState(value)
	const ref = useRef<HTMLInputElement | null>(null)

	useEffect(() => {
		if (editing) ref.current?.focus()
	}, [editing])

	const save = async () => {
		setEditing(false)
		if (draft.trim() && draft !== value) await onSave(draft)
	}

	if (!editing) {
		return (
			<button
				onClick={() => setEditing(true)}
				className={`${className} hover:underline text-left`}
			>
				{value}
			</button>
		)
	}

	return (
		<input
			ref={ref}
			value={draft}
			onChange={(e) => setDraft(e.target.value)}
			onBlur={save}
			onKeyDown={(e) => {
				if (e.key === "Enter") save()
				if (e.key === "Escape") setEditing(false)
			}}
			className="border px-1 w-full"
		/>
	)
}
