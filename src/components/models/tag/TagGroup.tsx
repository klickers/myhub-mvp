import { useState } from "react"
import { Icon } from "@iconify/react"
import type { Tag } from "@/generated/prisma/client"
import TagCreateForm from "@/components/models/tag/CreateTagForm"
import type { TagWithChildren } from "@/types/prisma-custom"

const isActive = (path: string, href: string) => {
	return href === "/" ? path === "/" : path === href // || path.startsWith(href + "/")
}

export default function TagGroup({
	group,
	path,
}: {
	group: Tag | TagWithChildren
	path: string
}) {
	const [showInput, setShowInput] = useState(false)
	const [tags, setTags] = useState<Tag[]>(group.children ?? [])

	return (
		<div>
			<div className="flex items-center gap-1 w-full">
				<a
					href={`/groups/${group.slug}`}
					className={
						"text-sm font-medium" +
						(isActive(path, `/groups/${group.slug}`)
							? " underline"
							: "")
					}
				>
					{group.name}
				</a>
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
						className={
							"block hover:underline" +
							(isActive(path, `/tags/${tag.slug}`)
								? " underline"
								: "")
						}
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
