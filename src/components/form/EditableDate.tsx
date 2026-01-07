export default function EditableDate({
	value,
	onSave,
}: {
	value: string | null
	onSave: (v: string | null) => Promise<void>
}) {
	return (
		<input
			type="date"
			value={value ? value.slice(0, 10) : ""}
			onChange={(e) => onSave(e.target.value || null)}
			className="border px-1"
		/>
	)
}
