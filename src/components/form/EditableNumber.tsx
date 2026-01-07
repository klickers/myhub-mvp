import { useState } from "react"

export default function EditableNumber({
	value,
	onSave,
}: {
	value: number | null
	onSave: (v: number | null) => Promise<void>
}) {
	const [editing, setEditing] = useState(false)
	const [draft, setDraft] = useState(value?.toString() ?? "")

	const save = async () => {
		setEditing(false)
		await onSave(draft === "" ? null : Number(draft))
	}

	if (!editing) {
		return (
			<button
				onClick={() => setEditing(true)}
				className="hover:underline"
			>
				{value ?? "—"} minutes
			</button>
		)
	}

	return (
		<input
			type="number"
			className="border px-1 w-24"
			value={draft}
			onChange={(e) => setDraft(e.target.value)}
			onBlur={save}
			onKeyDown={(e) => e.key === "Enter" && save()}
		/>
	)
}
