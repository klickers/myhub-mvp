import { create } from "zustand"
import { actions } from "astro:actions"
import { startOfWeek, addDays, format } from "date-fns"
import type { AgendaWithIncludes } from "@/types/prisma-custom"

type AgendaStore = {
	agendaByWeek: Record<string, AgendaWithIncludes[]>
	loadingWeeks: Record<string, boolean>
	daysByWeek: Record<string, { date: Date; tasks: AgendaWithIncludes[] }[]>

	// setting
	loadAgendaWeek: (dayInWeek?: Date) => Promise<void>

	// getting
	getWeekKey: (dayInWeek?: Date) => string

	// updating
	createAgendaItem: (
		date: Date,
		itemType: "task" | "tag",
		itemId: number,
	) => Promise<AgendaWithIncludes | undefined>
	updateAgendaItem: (
		id: number,
		patch: Parameters<typeof actions.agenda.update>[0],
	) => Promise<any | undefined>
	removeAgendaItem: (id: number) => Promise<any | undefined>
}

export const useAgendaStore = create<AgendaStore>((set, get) => ({
	agendaByWeek: {},
	loadingWeeks: {},
	daysByWeek: {},

	loadAgendaWeek: async (dayInWeek = new Date()) => {
		// check if week loaded
		const days = [],
			sun = startOfWeek(dayInWeek, { weekStartsOn: 0 }),
			weekKey = format(sun, "yyyy-MM-dd")
		if (get().loadingWeeks[weekKey] || get().agendaByWeek[weekKey]) return
		set({ loadingWeeks: { ...get().loadingWeeks, [weekKey]: true } })

		// initialize week
		for (let i = 0; i < 7; i++)
			days.push({
				date: addDays(sun, i),
				tasks: [],
			})
		set({ daysByWeek: { ...get().daysByWeek, [weekKey]: days } })

		const res = await actions.agenda.getBetweenRange({
			start: days[0].date,
			end: addDays(days[6].date, 1), // add 1 day to include the last day
		})
		if (res.error) {
			console.error("Failed to load agenda items:", res.error)
			return
		}
		set((state) => ({
			agendaByWeek: { ...state.agendaByWeek, [weekKey]: res.data ?? [] },
			loadingWeeks: { ...state.loadingWeeks, [weekKey]: false },
		}))
	},

	// ===================================
	// Getting
	// ===================================
	getWeekKey: (dayInWeek = new Date()) => {
		const sun = startOfWeek(dayInWeek, { weekStartsOn: 0 })
		return format(sun, "yyyy-MM-dd")
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
		const weekKey = get().getWeekKey(date)
		set((state) => ({
			agendaByWeek: {
				...state.agendaByWeek,
				[weekKey]: [
					...state.agendaByWeek[weekKey],
					res.data as AgendaWithIncludes,
				],
			},
		}))
		return res.data
	},
	updateAgendaItem: async (id, patch) => {
		const res = await actions.agenda.update({ ...patch })
		if (res.error) {
			console.error("Failed to update agenda item:", res.error)
			return undefined
		}
		const weekKey = get().getWeekKey(res.data.date)
		set((state) => ({
			agendaByWeek: {
				...state.agendaByWeek,
				[weekKey]: state.agendaByWeek[weekKey].map((agenda) =>
					agenda.id === id ? { ...agenda, ...res.data } : agenda,
				),
			},
		}))
		return res.data
	},
	removeAgendaItem: async (id) => {
		const res = await actions.agenda.delete({ id })
		if (res.error) {
			console.error("Failed to delete agenda item:", res.error)
			return undefined
		}
		const weekKey = get().getWeekKey(res.data.date)
		set((state) => ({
			agendaByWeek: {
				...state.agendaByWeek,
				[weekKey]: state.agendaByWeek[weekKey].filter(
					(agenda) => agenda.id !== id,
				),
			},
		}))
		return res.data
	},
}))
