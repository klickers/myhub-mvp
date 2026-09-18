import { useState } from "react"
import { Icon } from "@iconify/react"
import type { Tag } from "@/generated/prisma/client"
import TagCreateForm from "@/components/models/tag/CreateTagForm"
import type { TagWithChildren } from "@/types/prisma-custom"

export default function TagGroup({ group }: { group: Tag | TagWithChildren }) {
	const [showInput, setShowInput] = useState(false)
	const [tags, setTags] = useState<Tag[]>(group.children ?? [])

	return (
		<div>
			<div className="flex items-center gap-1 w-full">
				<span className="text-sm font-medium">{group.name}</span>
				<button onClick={() => setShowInput(!showInput)}>
					{showInput ? (
						<Icon icon="mingcute:minimize-fill" />
					) : (
						<Icon icon="mingcute:add-fill" />
					)}
				</button>
			</div>

			<div className="ml-4 mb-2">
				{tags.map((tag) => (
					<a
						key={tag.id}
						href={`/tags/${tag.slug}`}
						className="block hover:underline"
					>
						<span className="text-sm">{tag.name}</span>
					</a>
				))}

				{showInput && (
					<TagCreateForm
						type="tag"
						parentId={group.id}
						successMessage={(name) =>
							`Tag ${name} added successfully to ${group.name}!`
						}
						onCreated={(tag) => setTags((tags) => [...tags, tag])}
						onClose={() => setShowInput(false)}
					/>
				)}
			</div>
		</div>
	)
}
