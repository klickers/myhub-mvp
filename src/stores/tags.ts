import { create } from "zustand"
import type { TagWithChildren } from "@/types/prisma-custom"
import { actions } from "astro:actions"

type TagsStore = {
	tags: TagWithChildren[]
	isLoading: boolean
	isLoaded: boolean

	// tagMap: Record<number, TagWithChildren>

	loadTags: () => void
}

export const useTagsStore = create<TagsStore>((set, get) => ({
	tags: [],
	isLoading: false,
	isLoaded: false,

	// tagMap: {},

	loadTags: async () => {
		if (get().isLoaded || get().isLoading) return
		set({ isLoading: true })

		const res = await actions.tag.getAllTagGroups({})
		if (res.error) {
			console.error("Failed to load tags:", res.error)
			set({ isLoading: false })
			return
		}
		set({
			tags: res.data ?? [],
			// tagMap: (res.data ?? []).reduce(
			// 	(acc, tag) => {
			// 		acc[tag.id] = tag
			// 		return acc
			// 	},
			// 	{} as Record<number, TagWithChildren>,
			// ),
			isLoaded: true,
			isLoading: false,
		})
	},
}))
