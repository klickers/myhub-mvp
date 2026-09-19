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
			className="bg-tranparent p-0 max-w-28"
		/>
	)
}
