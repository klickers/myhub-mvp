import { create } from "zustand"
import { actions } from "astro:actions"
import { startOfWeek, addDays } from "date-fns"
import type { AgendaWithIncludes } from "@/types/prisma-custom"

type AgendaStore = {
	agenda: AgendaWithIncludes[]
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
	updateAgendaItem: (
		id: number,
		patch: Parameters<typeof actions.agenda.update>[0],
	) => Promise<any | undefined>
	removeAgendaItem: (id: number) => Promise<any | undefined>
}

export const useAgendaStore = create<AgendaStore>((set, get) => ({
	agenda: [],
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

		const res = await actions.agenda.getBetweenRange({
			start: days[0].date,
			end: addDays(days[6].date, 1), // add 1 day to include the last day
		})
		if (res.error) {
			console.error("Failed to load agenda items:", res.error)
			set({ isLoading: false })
			return
		}
		set({
			agenda: res.data ?? [],
			isLoaded: true,
			isLoading: false,
		})
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

		set((state) => ({
			agenda: [...state.agenda, res.data as AgendaWithIncludes],
		}))
	},
	updateAgendaItem: async (id, patch) => {
		const res = await actions.agenda.update({ ...patch })
		if (res.error) {
			console.error("Failed to update agenda item:", res.error)
			return undefined
		}
		set((state) => ({
			agenda: state.agenda.map((agenda) =>
				agenda.id === id ? { ...agenda, ...res.data } : agenda,
			),
		}))
		return res.data
	},
	removeAgendaItem: async (id) => {
		const res = await actions.agenda.delete({ id })
		if (res.error) {
			console.error("Failed to delete agenda item:", res.error)
			return undefined
		}
		set((state) => ({
			agenda: state.agenda.filter((agenda) => agenda.id !== id),
		}))
		return res.data
	},
}))
