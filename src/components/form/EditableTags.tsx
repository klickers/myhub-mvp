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
			<div className="flex items-center gap-0.5">
				{selectedTags.map((tag) => (
					<button
						key={tag.id}
						className="bg-gray-100 text-gray-700 rounded-3xl px-1 inline-block hover:bg-red-100 hover:text-red-700"
						onClick={async (e) => {
							e.preventDefault()
							setSelectedTags((prevState) =>
								prevState.filter((t) => t.id !== tag.id),
							)
							await onSave(
								selectedTags.filter((t) => t.id !== tag.id),
							)
						}}
					>
						{tag.name}
					</button>
				))}
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
						setSelectedTags((prevState) => [
							...prevState,
							tags
								.flatMap((t) => t.children)
								.find((c) => c.slug === e.target.value),
						])
						await onSave([
							...selectedTags,
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
