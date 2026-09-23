import { create } from "zustand"
import type { TaskWithTags, TaskNode } from "@/types/prisma-custom"
import { actions } from "astro:actions"

type TasksStore = {
	tasks: TaskWithTags[]
	isLoading: boolean
	isLoaded: boolean

	// side tray
	selectedTaskId: number | null
	isSideTrayOpen: boolean
	setSelectedTaskId: (id: number | null) => void
	openSideTray: (id: number) => void
	closeSideTray: () => void

	// indices
	// rootTaskIds: number[]
	// childrenByParentId: Record<number, number[]>
	// taskIdsByTagId: Record<number, number[]>
	// untaggedTaskIds: number[]

	// setting
	loadTasks: () => void
	refetchTaskById: (id: number) => Promise<TaskWithTags | undefined>

	// getting
	getTasks: () => TaskWithTags[]
	getTaskById: (id: number) => TaskWithTags

	// updating
	createTask: (task: {
		name: string
		parentTaskId?: number | null
		tags?: number[] | undefined
	}) => Promise<TaskNode | undefined> // return id
	removeTask: (id: number) => void
	updateTask: (
		id: number,
		patch: Parameters<typeof actions.task.update>[0],
	) => Promise<TaskNode | undefined>
}

export const useTasksStore = create<TasksStore>((set, get) => ({
	tasks: [],
	isLoading: false,
	isLoaded: false,

	// ===================================
	// Side Tray
	// ===================================
	selectedTaskId: null,
	isSideTrayOpen: false,
	setSelectedTaskId: (id: number | null) => {
		set({ selectedTaskId: id, isSideTrayOpen: id !== null })
	},
	openSideTray: (id: number) => {
		set({ selectedTaskId: id, isSideTrayOpen: true })
	},
	closeSideTray: () => {
		set({ selectedTaskId: null, isSideTrayOpen: false })
	},

	// ===================================
	// Indices
	// ===================================
	// rootTaskIds: [],
	// childrenByParentId: {},
	// taskIdsByTagId: {},
	// untaggedTaskIds: [],

	// ===================================
	// Setting
	// ===================================
	loadTasks: async () => {
		if (get().isLoaded || get().isLoading) return
		set({ isLoading: true })

		const res = await actions.task.getAll({})
		if (res.error) {
			console.error("Failed to load tasks:", res.error)
			set({ isLoading: false })
			return
		}
		set({
			tasks: res.data ?? [],
			isLoaded: true,
			isLoading: false,
			// rootTaskIds:
			// 	res.data
			// 		?.filter((task) => !task.parentTaskId)
			// 		.map((task) => task.id) ?? [],
			// childrenByParentId:
			// 	res.data?.reduce(
			// 		(acc, task) => {
			// 			if (task.parentTaskId) {
			// 				if (!acc[task.parentTaskId])
			// 					acc[task.parentTaskId] = []
			// 				acc[task.parentTaskId].push(task.id)
			// 			}
			// 			return acc
			// 		},
			// 		{} as Record<number, number[]>,
			// 	) ?? {},
			// taskIdsByTagId:
			// 	res.data?.reduce(
			// 		(acc, task) => {
			// 			for (const tag of task.tags) {
			// 				if (!acc[tag.tagId]) acc[tag.tagId] = []
			// 				acc[tag.tagId].push(task.id)
			// 			}
			// 			return acc
			// 		},
			// 		{} as Record<number, number[]>,
			// 	) ?? {},
			// untaggedTaskIds:
			// 	res.data
			// 		?.filter((task) => task.tags.length === 0)
			// 		.map((task) => task.id) ?? [],
		})
	},
	refetchTaskById: async (id) => {
		const res = await actions.task.getById({ id })
		if (res.error) {
			console.error("Failed to refetch task:", res.error)
			return undefined
		}
		if (!res.data) return undefined
		set((state) => ({
			tasks: state.tasks.map((task) =>
				task.id === id ? { ...task, ...res.data } : task,
			),
		}))
		return res.data
	},

	// ===================================
	// Getting
	// ===================================
	getTasks: () => get().tasks,
	getTaskById: (id: number) => {
		const task = get().tasks.find((task) => task.id === id)
		if (!task) throw new Error(`Task with id ${id} not found`)
		return task
	},

	// ===================================
	// Updating
	// ===================================
	createTask: async (task) => {
		const res = await actions.task.create({
			name: task.name,
			parentType: task.parentTaskId ? "task" : "none",
			parentTaskId: task.parentTaskId ?? undefined,
			tags: task.tags ?? undefined,
		})
		if (res.error) {
			console.error("Failed to create task:", res.error)
			return undefined
		}

		set((state) => ({
			tasks: [...state.tasks, res.data],
		}))

		// return new task
		return {
			...res.data,
			subtasks: [],
		}
	},
	removeTask: async (id: number) => {
		const res = await actions.task.delete({ id })
		if (res.error) {
			console.error("Failed to delete task:", res.error)
			return undefined
		}
		set((state) => ({
			tasks: state.tasks.filter((task) => task.id !== id),
		}))
		return res.data
	},
	updateTask: async (id, patch) => {
		const res = await actions.task.update({ ...patch })
		if (res.error) {
			console.error("Failed to update task:", res.error)
			return undefined
		}

		set((state) => ({
			tasks: state.tasks.map((task) =>
				task.id === id ? { ...task, ...res.data } : task,
			),
		}))

		// return new task
		return {
			...res.data,
			subtasks: [],
		}
	},
}))
