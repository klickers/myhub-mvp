export default function EditableBoolean({
	value,
	onSave,
	className,
}: {
	value: boolean
	onSave: (v: boolean) => Promise<void>
	className?: string
}) {
	return (
		<input
			type="checkbox"
			checked={value}
			onChange={(e) => onSave(e.target.checked)}
			className={["", className ?? ""].filter(Boolean).join(" ")}
		/>
	)
}
