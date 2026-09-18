import { useState } from "react"
import { toast } from "react-toastify"

import { actions } from "astro:actions"
import slugify from "@/helpers/slugify"
import type { Tag, TagType } from "@/generated/prisma/client"

type Props = {
	type: TagType
	parentId?: number
	successMessage: (name: string) => string
	onCreated?: (tag: Tag) => void
	onClose: () => void
}

export default function TagCreateForm({
	type,
	parentId,
	successMessage,
	onCreated,
	onClose,
}: Props) {
	const [name, setName] = useState("")
	const [slug, setSlug] = useState("")

	function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
		setName(e.target.value)
		setSlug(slugify(e.target.value))
	}
	function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
		setSlug(slugify(e.target.value))
	}

	async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" && name && slug) {
			const { data, error } = await actions.tag.create({
				name,
				slug,
				type,
				parentId,
			})
			if (error) {
				toast.error(`Failed to create ${type}`)
			} else {
				toast.success(successMessage(name))
				onCreated?.(data)
				setName("")
				setSlug("")
				onClose()
			}
		}
	}

	return (
		<div className="mb-2 w-full">
			<input
				type="text"
				placeholder="Name"
				autoFocus
				value={name}
				onKeyDown={handleKeyDown}
				onChange={handleNameChange}
			/>
			<input
				type="text"
				placeholder="Slug"
				value={slug}
				onKeyDown={handleKeyDown}
				onChange={handleSlugChange}
			/>
		</div>
	)
}
