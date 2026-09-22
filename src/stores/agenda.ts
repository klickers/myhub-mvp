import { create } from "zustand"
import type { TagWithChildren } from "@/types/prisma-custom"
import { startOfWeek, addDays } from "date-fns"

type AgendaStore = {
	tags: TagWithChildren[]
	isLoading: boolean
	isLoaded: boolean

	days: { date: Date; tasks: any[] }[]

	loadAgenda: () => void
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
}))
