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
	effectiveTagIdsByTaskId: Record<number, number[]>
	taskIdsByEffectiveTagId: Record<number, number[]>
	taskIdsByEffectiveTagGroupId: Record<number, number[]>
	untaggedTaskIds: number[]

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

	// relations
	addNoteToTask: (taskId: number, noteId: number) => void
}

function buildTaskIndexes(tasks: TaskWithTags[]): {
	effectiveTagIdsByTaskId: Record<number, number[]>
	taskIdsByEffectiveTagId: Record<number, number[]>
	taskIdsByEffectiveTagGroupId: Record<number, number[]>
	untaggedTaskIds: number[]
} {
	const byId = new Map(tasks.map((task) => [task.id, task]))
	const effectiveTagIdsByTaskId: Record<number, number[]> = {}
	const effectiveTagGroupIdsByTaskId: Record<number, number[]> = {}
	const taskIdsByEffectiveTagId: Record<number, number[]> = {}
	const taskIdsByEffectiveTagGroupId: Record<number, number[]> = {}
	const untaggedTaskIds: number[] = []

	const resolve = (
		task: TaskWithTags,
		seen = new Set<number>(),
	): number[] => {
		const cached = effectiveTagIdsByTaskId[task.id]
		if (cached) return cached

		if (seen.has(task.id)) {
			effectiveTagIdsByTaskId[task.id] = []
			effectiveTagGroupIdsByTaskId[task.id] = []
			return []
		}

		if (task.tags.length > 0) {
			const tagIds = Array.from(
				new Set(task.tags.map((tag) => tag.tagId)),
			)
			effectiveTagIdsByTaskId[task.id] = tagIds
			effectiveTagGroupIdsByTaskId[task.id] = Array.from(
				new Set(
					task.tags
						.map((tag) => tag.tag.parentId)
						.filter((id): id is number => id !== null),
				),
			)
			return tagIds
		}

		const parent = task.parentTaskId
			? byId.get(task.parentTaskId)
			: undefined
		if (!parent) {
			effectiveTagIdsByTaskId[task.id] = []
			effectiveTagGroupIdsByTaskId[task.id] = []
			return []
		}

		seen.add(task.id)
		effectiveTagIdsByTaskId[task.id] = resolve(parent, seen)
		effectiveTagGroupIdsByTaskId[task.id] =
			effectiveTagGroupIdsByTaskId[parent.id] ?? []
		return effectiveTagIdsByTaskId[task.id]
	}

	for (const task of tasks) {
		const tagIds = resolve(task)
		if (tagIds.length === 0) {
			untaggedTaskIds.push(task.id)
			continue
		}
		for (const tagId of tagIds) {
			if (!taskIdsByEffectiveTagId[tagId])
				taskIdsByEffectiveTagId[tagId] = []
			taskIdsByEffectiveTagId[tagId].push(task.id)
		}
		for (const tagGroupId of effectiveTagGroupIdsByTaskId[task.id] ?? []) {
			if (!taskIdsByEffectiveTagGroupId[tagGroupId])
				taskIdsByEffectiveTagGroupId[tagGroupId] = []
			taskIdsByEffectiveTagGroupId[tagGroupId].push(task.id)
		}
	}

	return {
		effectiveTagIdsByTaskId,
		taskIdsByEffectiveTagId,
		taskIdsByEffectiveTagGroupId,
		untaggedTaskIds,
	}
}

function getTasksState(tasks: TaskWithTags[]) {
	return {
		tasks,
		...buildTaskIndexes(tasks),
	}
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
	effectiveTagIdsByTaskId: {},
	taskIdsByEffectiveTagId: {},
	taskIdsByEffectiveTagGroupId: {},
	untaggedTaskIds: [],

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
			...getTasksState(res.data ?? []),
			isLoaded: true,
			isLoading: false,
		})
	},
	refetchTaskById: async (id) => {
		const res = await actions.task.getById({ id })
		if (res.error) {
			console.error("Failed to refetch task:", res.error)
			return undefined
		}
		if (!res.data) return undefined
		set((state) =>
			getTasksState(
				state.tasks.map((task) =>
					task.id === id ? { ...task, ...res.data } : task,
				),
			),
		)
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

		set((state) => getTasksState([...state.tasks, res.data]))

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
		set((state) =>
			getTasksState(state.tasks.filter((task) => task.id !== id)),
		)
		return res.data
	},
	updateTask: async (id, patch) => {
		const res = await actions.task.update({ ...patch })
		if (res.error) {
			console.error("Failed to update task:", res.error)
			return undefined
		}

		set((state) =>
			getTasksState(
				state.tasks.map((task) =>
					task.id === id ? { ...task, ...res.data } : task,
				),
			),
		)

		// return new task
		return {
			...res.data,
			subtasks: [],
		}
	},

	// ===================================
	// Relations
	// ===================================
	addNoteToTask: (taskId: number, noteId: number) => {
		set((state) => {
			const task = state.tasks.find((t) => t.id === taskId)
			if (!task) return state
			const updatedTask = {
				...task,
				notes: [...task.notes, { noteId }],
			}
			return getTasksState(
				state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
			)
		})
	},
}))
