import { defineAction } from "astro:actions"
import { z } from "zod"
import prisma from "@/helpers/prisma"
import { Status, TaskParentType } from "@/generated/prisma/enums"

const taskInput = z
	.object({
		name: z.string().min(1),

		parentType: z.nativeEnum(TaskParentType).default("contract"),
		status: z.nativeEnum(Status).default("notstarted"),

		estimatedTime: z.number().int().nonnegative().optional(),
		deadline: z.coerce.date().optional(),

		contractId: z.number().int().positive().optional(),
		experimentId: z.number().int().positive().optional(),
		parentTaskId: z.number().int().positive().optional(),
		guildId: z.number().int().positive().optional(),

		// for form handling
		contractSlug: z.string().optional(),
		guildSlug: z.string().optional(),
		experimentSlug: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		const parentIds = [
			data.contractId,
			data.experimentId,
			data.parentTaskId,
			data.guildId,
		].filter((v) => v != null)

		// Rule: only one parent (or none)
		if (parentIds.length > 1) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "A task can have only one parent",
			})
		}

		// Rule: parentType must match the provided parent id
		if (data.parentType === "none" && parentIds.length > 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "parentType is 'none' but a parent id was provided",
			})
		}

		if (data.parentType === "contract" && !data.contractId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "parentType is 'contract' but contractId is missing",
			})
		}

		if (data.parentType === "experiment" && !data.experimentId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message:
					"parentType is 'experiment' but experimentId is missing",
			})
		}

		if (data.parentType === "task" && !data.parentTaskId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "parentType is 'task' but parentTaskId is missing",
			})
		}

		if (data.parentType === "guild" && !data.guildId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "parentType is 'guild' but guildId is missing",
			})
		}
	})

type TaskNode = {
	id: number
	name: string
	status: Status
	parentTaskId: number | null
	estimatedTime: number | null
	deadline: Date | null
	children: TaskNode[]
}

const STATUS_ORDER: Record<Status, number> = {
	notstarted: 0,
	inprogress: 1,
	onhold: 2,
	completed: 3,
	archived: 4,
}

async function buildSubtaskTree(rootTaskId: number): Promise<TaskNode[]> {
	// Fetch all descendants using a simple BFS (multiple queries).
	// Good enough for typical UI usage; if you expect huge trees, we can optimize later.
	const all: Array<{
		id: number
		name: string
		parentTaskId: number | null
		status: Status
		estimatedTime: number | null
		deadline: Date | null
	}> = []

	let frontier: number[] = [rootTaskId]
	const seen = new Set<number>([rootTaskId])

	while (frontier.length > 0) {
		const children = await prisma.task.findMany({
			where: {
				parentType: "task",
				parentTaskId: { in: frontier },
			},
			select: {
				id: true,
				name: true,
				status: true,
				estimatedTime: true,
				deadline: true,
				parentTaskId: true,
			},
			orderBy: [{ status: "asc" }, { id: "asc" }],
		})

		all.push(...children)

		const next: number[] = []
		for (const c of children) {
			if (!seen.has(c.id)) {
				seen.add(c.id)
				next.push(c.id)
			}
		}
		frontier = next
	}

	// Build parent->children map
	const byParent = new Map<number, TaskNode[]>()
	for (const t of all) {
		const node: TaskNode = { ...t, children: [] }
		const parentId = t.parentTaskId ?? -1
		const arr = byParent.get(parentId) ?? []
		arr.push(node)
		byParent.set(parentId, arr)
	}

	// Attach children recursively
	const attach = (node: TaskNode) => {
		const kids = byParent.get(node.id) ?? []
		kids.sort((a, b) => {
			const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
			if (s !== 0) return s
			if (!a.deadline && !b.deadline) return 0
			else if (!a.deadline) return 1
			else if (!b.deadline) return -1
			return a.deadline.getTime() - b.deadline.getTime()
		})
		node.children = kids
		for (const k of kids) attach(k)
	}

	// Roots are direct children of rootTaskId
	const roots = byParent.get(rootTaskId) ?? []
	for (const r of roots) attach(r)

	return roots
}

export const task = {
	create: defineAction({
		accept: "form",
		input: taskInput,
		handler: async (input) => {
			const task = await prisma.task.create({
				data: {
					name: input.name,
					parentType: input.parentType,
					status: input.status,
					estimatedTime: input.estimatedTime,
					deadline: input.deadline && new Date(input.deadline),
					contractId: input.contractId ?? null,
					experimentId: input.experimentId ?? null,
					parentTaskId: input.parentTaskId ?? null,
					guildId: input.guildId ?? null,
				},
			})
			return {
				task,
				contractSlug: input.contractSlug,
				guildSlug: input.guildSlug,
				experimentSlug: input.experimentSlug,
			}
		},
	}),
	createSubtask: defineAction({
		input: z.object({
			name: z.string().min(1),
			parentTaskId: z.number().int().positive(),
			status: z.nativeEnum(Status).optional(),
			estimatedTime: z.number().int().nonnegative().optional(),
			deadline: z.coerce.date().optional().nullable(),
		}),
		handler: async ({
			name,
			parentTaskId,
			status = "notstarted",
			estimatedTime,
			deadline,
		}) => {
			return prisma.task.create({
				data: {
					name,
					parentType: "task",
					parentTaskId,
					status,
					estimatedTime,
					deadline,
				},
			})
		},
	}),
	createErrand: defineAction({
		input: z.object({
			name: z.string().min(1),
			status: z.nativeEnum(Status).optional(),
			estimatedTime: z.number().int().nonnegative().optional(),
			deadline: z.coerce.date().optional().nullable(),
		}),
		handler: async ({
			name,
			status = "notstarted",
			estimatedTime,
			deadline,
		}) => {
			return prisma.task.create({
				data: {
					name,
					parentType: "none",
					status,
					estimatedTime,
					deadline,
				},
			})
		},
	}),
	update: defineAction({
		input: z.object({
			id: z.coerce.number().int(),
			name: z.string().min(1).optional(),
			status: z.nativeEnum(Status).optional(),
			estimatedTime: z.number().int().nonnegative().optional(),
			deadline: z.coerce.date().optional().nullable(),
		}),
		handler: async ({ id, ...data }) => {
			return prisma.task.update({
				where: { id },
				data,
			})
		},
	}),
	delete: defineAction({
		input: z.object({
			id: z.coerce.number().int(),
		}),
		handler: async ({ id }) => {
			return prisma.task.delete({
				where: { id },
			})
		},
	}),
	getById: defineAction({
		input: z.object({
			id: z.number(),
		}),
		handler: async ({ id }) => {
			return prisma.task.findUnique({
				where: { id },
			})
		},
	}),
	listAll: defineAction({
		input: z.object({
			status: z.array(z.nativeEnum(Status)).optional(),
			from: z.coerce.date().optional(),
			to: z.coerce.date().optional(),
			includeContract: z.boolean().default(false),
			includeGuild: z.boolean().default(false),
			includeExperiment: z.boolean().default(false),
		}),
		handler: async ({
			status,
			from,
			to,
			includeContract,
			includeGuild,
			includeExperiment,
		}) => {
			return prisma.task.findMany({
				where: {
					...(status && { status: { in: status } }),
					...(from || to
						? {
								deadline: {
									...(from && { gte: from }),
									...(to && { lte: to }),
								},
						  }
						: {}),
				},
				include: {
					contract: includeContract,
					guild: includeGuild,
					experiment: includeExperiment,
				},
				orderBy: { deadline: "asc" },
			})
		},
	}),
	listByContract: defineAction({
		input: z.object({
			contractId: z.coerce.number().int(),
			status: z.array(z.nativeEnum(Status)).optional(),
			includeSubtasks: z.boolean().default(false),
		}),
		handler: async ({ contractId, status, includeSubtasks }) => {
			return prisma.task.findMany({
				where: {
					contractId,
					status: { in: status },
				},
				include: {
					...(includeSubtasks && { subtasks: true }),
				},
				orderBy: [{ deadline: "asc" }, { name: "asc" }],
			})
		},
	}),
	listByGuild: defineAction({
		input: z.object({
			guildId: z.coerce.number().int(),
			status: z.array(z.nativeEnum(Status)).optional(),
			includeSubtasks: z.boolean().default(false),
		}),
		handler: async ({ guildId, status, includeSubtasks }) => {
			return prisma.task.findMany({
				where: {
					guildId,
					status: { in: status },
				},
				include: {
					...(includeSubtasks && { subtasks: true }),
				},
				orderBy: { deadline: "asc" },
			})
		},
	}),
	listByExperiment: defineAction({
		input: z.object({
			experimentId: z.coerce.number().int(),
			status: z.array(z.nativeEnum(Status)).optional(),
			includeSubtasks: z.boolean().default(false),
		}),
		handler: async ({ experimentId, status, includeSubtasks }) => {
			return prisma.task.findMany({
				where: {
					experimentId,
					status: { in: status },
				},
				include: {
					...(includeSubtasks && { subtasks: true }),
				},
				orderBy: { deadline: "asc" },
			})
		},
	}),
	listErrands: defineAction({
		input: z.object({
			status: z.array(z.nativeEnum(Status)).optional(),
		}),
		handler: async ({ status }) => {
			return prisma.task.findMany({
				where: {
					parentType: "none",
					status: { in: status },
				},
				orderBy: { deadline: "asc" },
			})
		},
	}),
	subtaskTreeByTaskId: defineAction({
		input: z.object({
			taskId: z.coerce.number().int().positive(),
		}),
		handler: async ({ taskId }) => {
			const tree = await buildSubtaskTree(taskId)
			return { tree }
		},
	}),
}
