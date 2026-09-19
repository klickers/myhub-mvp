import { useState } from "react"
import { Icon } from "@iconify/react"
import type { Tag } from "@/generated/prisma/client"
import type { TagWithChildren } from "@/types/prisma-custom"

export default function EditableTags({
	value,
	tags,
	onSave,
	className,
}: {
	value: Tag[] | null
	tags: TagWithChildren[]
	onSave: (v: Tag[]) => Promise<void>
	className?: string
}) {
	const [isEditing, setIsEditing] = useState(false)
	const [selectedTags, setSelectedTags] = useState<Tag[]>(value ?? [])
	const [input, setInput] = useState("")

	return (
		<div className="text-xs">
			<div className="flex items-center gap-1">
				<p className="mb-0">
					{selectedTags.map((tag, index) => (
						<span key={tag.id}>
							{tag.name +
								(index < selectedTags.length - 1 ? ", " : "")}
						</span>
					))}
				</p>
				<button onClick={() => setIsEditing(!isEditing)}>
					{isEditing ? (
						<Icon icon="mingcute:minimize-fill" />
					) : (
						<Icon icon="mingcute:add-fill" />
					)}
				</button>
			</div>

			{isEditing && (
				<select
					value={input}
					onChange={async (e) => {
						setInput(e.target.value)
						await onSave(selectedTags)
						setSelectedTags((prevState) => [
							...prevState,
							tags
								.flatMap((t) => t.children)
								.find((c) => c.slug === e.target.value),
						])
						setInput("")
					}}
					className={[
						"text-xs p-0 -ml-1",
						className ?? "bg-transparent border-0",
					]
						.filter(Boolean)
						.join(" ")}
				>
					<option value="">Select a tag</option>
					{tags.map(
						(tag) =>
							tag.children &&
							tag.children.map((child) => (
								<option
									key={child.id}
									value={child.slug}
								>
									{child.name}
								</option>
							)),
					)}
				</select>
			)}
		</div>
	)
}
