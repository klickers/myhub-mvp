import { create } from "zustand"
import type { TaskWithTags, TaskNode } from "@/types/prisma-custom"
import { actions } from "astro:actions"
import buildTaskTree, { buildFlatTaskTree } from "@/helpers/buildTaskTree"

type TaskStore = {
	tasks: TaskWithTags[]
	isLoading: boolean
	isLoaded: boolean

	// setting
	loadTasks: () => void

	// getting
	getTasks: () => TaskWithTags[]
	getTaskById: (id: number) => TaskWithTags

	// updating
	createTask: (task: {
		name: string
		parentTaskId?: number | null
		tags?: number[] | undefined
	}) => Promise<TaskNode | undefined> // return id
	updateTask: (
		id: number,
		patch: Parameters<typeof actions.task.update>[0],
	) => Promise<TaskNode | undefined>
}

export const useTasksStore = create<TaskStore>((set, get) => ({
	tasks: [],
	flatTasksTree: [],
	tasksTree: [],
	isLoading: false,
	isLoaded: false,

	// ===================================
	// Setting
	// ===================================
	loadTasks: async () => {
		if (get().isLoaded) return
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
		})
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
