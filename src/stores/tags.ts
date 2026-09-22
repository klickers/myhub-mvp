import { create } from "zustand"
import type { TagWithChildren } from "@/types/prisma-custom"
import { actions } from "astro:actions"

type TagsStore = {
	tags: TagWithChildren[]
	isLoading: boolean
	isLoaded: boolean

	loadTags: () => void
}

export const useTagsStore = create<TagsStore>((set, get) => ({
	tags: [],
	isLoading: false,
	isLoaded: false,

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
			isLoaded: true,
			isLoading: false,
		})
	},
}))
