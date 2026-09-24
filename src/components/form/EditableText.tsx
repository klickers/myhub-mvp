import { useEffect, useRef, useState } from "react"
import TextareaAutosize from "react-textarea-autosize"

export default function EditableText({
	value,
	onSave,
	className,
	inputClassName,
}: {
	value: string
	onSave: (v: string) => Promise<void>
	className?: string
	inputClassName?: string
}) {
	const [editing, setEditing] = useState(false)
	const [draft, setDraft] = useState(value)
	const ref = useRef<HTMLTextAreaElement | null>(null)
	const skipNextBlurSave = useRef(false)

	useEffect(() => {
		setDraft(value)
	}, [value])

	useEffect(() => {
		if (editing) {
			skipNextBlurSave.current = false
			ref.current?.focus()
			ref.current?.select()
		}
	}, [editing])

	const save = async () => {
		if (skipNextBlurSave.current) {
			skipNextBlurSave.current = false
			return
		}

		const next = draft.trim()
		skipNextBlurSave.current = true
		setEditing(false)
		if (next) setDraft(next)
		if (next && next !== value) await onSave(next)
	}

	const cancel = () => {
		skipNextBlurSave.current = true
		setDraft(value)
		setEditing(false)
	}

	if (!editing) {
		return (
			<button
				type="button"
				onClick={() => setEditing(true)}
				className={["text-left hover:underline", className]
					.filter(Boolean)
					.join(" ")}
			>
				{value}
			</button>
		)
	}

	return (
		<TextareaAutosize
			ref={ref}
			value={draft}
			onChange={(e) => setDraft(e.target.value)}
			onBlur={save}
			onKeyDown={(e) => {
				if (e.key === "Enter") save()
				if (e.key === "Escape") cancel()
			}}
			className={[
				"border-0 border-b border-black px-1 py-0 bg-transparent rounded-none",
				className,
				inputClassName,
			]
				.filter(Boolean)
				.join(" ")}
			minRows={1}
		/>
	)
}
