import { useState } from "react"
import { Icon } from "@iconify/react"
import { toast } from "react-toastify"

import { actions } from "astro:actions"
import slugify from "@/helpers/slugify"
import type { Tag } from "@/generated/prisma/client"

export default function TagGroupHeader({
	initialGroups,
}: {
	initialGroups: Tag[]
}) {
	const [showInput, setShowInput] = useState(false)
	const [name, setName] = useState("")
	const [slug, setSlug] = useState("")
	const [groups, setGroups] = useState<Tag[]>(initialGroups)

	function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
		setName(e.target.value)
		setSlug(slugify(e.target.value))
	}
	function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
		setSlug(slugify(e.target.value))
	}
	async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" && name && slug) {
			const { data: newGroup, error } = await actions.tag.create({
				name,
				slug,
				type: "group",
			})
			if (error) {
				toast.error("Failed to create tag group")
			} else {
				toast.success("Tag group " + name + " created successfully!")
				setGroups((groups) => [...groups, newGroup])
				setName("")
				setSlug("")
				setShowInput(false)
			}
		}
	}

	return (
		<div className="w-40">
			<div className="flex items-center justify-between gap-3 w-full mb-1">
				<p className="uppercase font-semibold flex items-center gap-1 mb-0">
					Groups
				</p>
				<button onClick={() => setShowInput(!showInput)}>
					{showInput ? (
						<Icon icon="mingcute:minus-circle-fill" />
					) : (
						<Icon icon="mingcute:add-circle-fill" />
					)}
				</button>
			</div>

			{showInput && (
				<div className="mb-2 w-full">
					<input
						type="text"
						placeholder="Name"
						autoFocus
						value={name}
						onKeyDown={(e) => handleKeyDown(e)}
						onChange={(e) => handleNameChange(e)}
					/>
					<input
						type="text"
						placeholder="Slug"
						value={slug}
						onKeyDown={(e) => handleKeyDown(e)}
						onChange={(e) => handleSlugChange(e)}
					/>
				</div>
			)}

			<div>
				{groups.map((group) => (
					<div key={group.id}>
						<span className="text-sm font-medium">
							{group.name}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}
