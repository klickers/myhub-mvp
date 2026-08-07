import type { MakeTimeType } from "@/generated/prisma/enums"

export default function EditableMakeTimeType({
	value,
	onSave,
}: {
	value: MakeTimeType | "none" | null
	onSave: (v: MakeTimeType | "none") => Promise<void>
}) {
	return (
		<select
			value={value ?? "none"}
			onChange={(e) =>
				onSave(e.target.value as MakeTimeType | "none")
			}
			className="border px-1 bg-white"
		>
			<option value="none">N/A</option>
			<option value="highlight">Highlight</option>
			<option value="batch">Batch</option>
		</select>
	)
}
