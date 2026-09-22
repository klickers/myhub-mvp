import { create } from "zustand"
import type { TagWithChildren } from "@/types/prisma-custom"
import { actions } from "astro:actions"
import { startOfWeek, addDays } from "date-fns"

type AgendaStore = {
	tags: TagWithChildren[]
	isLoading: boolean
	isLoaded: boolean

	days: { date: Date; tasks: any[] }[]

	loadAgenda: () => void

	// updating
	createAgendaItem: (
		date: Date,
		itemType: "task" | "tag",
		itemId: number,
	) => Promise<void>
}

export const useAgendaStore = create<AgendaStore>((set, get) => ({
	tags: [],
	isLoading: false,
	isLoaded: false,

	days: [],

	loadAgenda: async () => {
		if (get().isLoaded || get().isLoading) return
		set({ isLoading: true })

		// initialize the week
		const days = [],
			sun = startOfWeek(new Date())
		for (let i = 0; i < 7; i++)
			days.push({
				date: addDays(sun, i),
				tasks: [],
			})
		set({ days })
	},

	// ===================================
	// Updating
	// ===================================
	createAgendaItem: async (date, itemType, itemId) => {
		const res = await actions.agenda.create({
			date,
			tagId: itemType === "tag" ? itemId : null,
			taskId: itemType === "task" ? itemId : null,
		})
		if (res.error) {
			console.error("Failed to create agenda item:", res.error)
			return undefined
		}
	},
}))
