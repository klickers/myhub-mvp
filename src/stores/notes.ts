import { create } from "zustand"
import type { Note } from "@/generated/prisma/client"
import { actions } from "astro:actions"
import { useTasksStore } from "./tasks"

type NotesStore = {
	notes: Record<number, Note>

	loadNotes: () => void
	// loadNote: (id: number) => void

	createNote: (taskId: number, title?: string) => Promise<Note | undefined> // requires taskId
	updateNote: (
		id: number,
		patch: Parameters<typeof actions.note.update>[0],
	) => Promise<Note | undefined>
	removeNote: (id: number) => Promise<Note | undefined>
}

export const useNotesStore = create<NotesStore>((set, get) => ({
	notes: {},

	// ===================================
	// Loading
	// ===================================
	loadNotes: async () => {
		const res = await actions.note.getAll()
		if (res.error) {
			console.error("Failed to load notes:", res.error)
			return
		}
		if (!res.data) return
		set({
			notes: res.data.reduce(
				(acc, note) => {
					acc[note.id] = note
					return acc
				},
				{} as Record<number, Note>,
			),
		})
	},
	// loadNote: async (id) => {
	// 	const res = await actions.note.getById({ id })
	// 	if (res.error) {
	// 		console.error("Failed to load note:", res.error)
	// 		return
	// 	}
	// 	if (!res.data) return
	// 	set({ notes: { ...get().notes, [id]: res.data } })
	// },

	// ===================================
	// Updating
	// ===================================
	createNote: async (taskId, title) => {
		const res = await actions.note.create({
			taskId,
			title,
		})
		if (res.error) {
			console.error("Failed to create note:", res.error)
			return
		}
		if (!res.data) return
		set({ notes: { ...get().notes, [res.data.id]: res.data } })

		// update task
		const addNoteToTask = useTasksStore.getState().addNoteToTask
		addNoteToTask(taskId, res.data.id)

		return res.data
	},
	updateNote: async (id, patch) => {
		const res = await actions.note.update(patch)
		if (res.error) {
			console.error("Failed to update note:", res.error)
			return
		}
		if (!res.data) return
		set({ notes: { ...get().notes, [id]: res.data } })
		return res.data
	},
	removeNote: async (id) => {
		const res = await actions.note.delete({ id })
		if (res.error) {
			console.error("Failed to remove note:", res.error)
			return
		}
		set(({ notes }) => {
			const { [id]: _, ...remainingNotes } = notes
			return { notes: remainingNotes }
		})

		// update task
		const removeNoteFromTask = useTasksStore.getState().removeNoteFromTask
		res.data.items.forEach((item) => {
			if (item.taskId) removeNoteFromTask(item.taskId, id)
		})

		return res.data
	},
}))
