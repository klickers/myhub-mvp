import type { Status } from "@/generated/prisma/enums"

export default function EditableStatus({
	value,
	onSave,
	className,
}: {
	value: Status
	onSave: (v: Status) => Promise<void>
	className?: string
}) {
	return (
		<select
			value={value}
			onChange={(e) => onSave(e.target.value as Status)}
			className={["border px-1", className ?? "bg-white"]
				.filter(Boolean)
				.join(" ")}
		>
			<option value="notstarted">Not started</option>
			<option value="inprogress">In progress</option>
			<option value="onhold">On hold</option>
			<option value="completed">Completed</option>
			<option value="archived">Archived</option>
		</select>
	)
}
