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

		// for form handling
		contractSlug: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		const parentIds = [
			data.contractId,
			data.experimentId,
			data.parentTaskId,
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
	})

type TaskNode = {
	id: number
	name: string
	parentTaskId: number | null
	children: TaskNode[]
}

async function buildSubtaskTree(rootTaskId: number): Promise<TaskNode[]> {
	// Fetch all descendants using a simple BFS (multiple queries).
	// Good enough for typical UI usage; if you expect huge trees, we can optimize later.
	const all: Array<{
		id: number
		name: string
		parentTaskId: number | null
	}> = []

	let frontier: number[] = [rootTaskId]
	const seen = new Set<number>([rootTaskId])

	while (frontier.length > 0) {
		const children = await prisma.task.findMany({
			where: {
				parentType: "task",
				parentTaskId: { in: frontier },
			},
			select: { id: true, name: true, parentTaskId: true },
			orderBy: { id: "asc" },
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
				},
			})
			return {
				task,
				contractSlug: input.contractSlug,
			}
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
		}),
		handler: async ({ status, from, to }) => {
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
				orderBy: { deadline: "asc" },
			})
		},
	}),
	listByContract: defineAction({
		input: z.object({
			contractId: z.coerce.number().int(),
			status: z.array(z.nativeEnum(Status)).optional(),
		}),
		handler: async ({ contractId, status }) => {
			return prisma.task.findMany({
				where: {
					contractId,
					status: { in: status },
				},
				orderBy: { deadline: "asc" },
			})
		},
	}),

	// TODO: edit if needed
	createSubtask: defineAction({
		input: z.object({
			parentTaskId: z.coerce.number().int().positive(),
			name: z.string().min(1),
		}),
		handler: async ({ parentTaskId, name }) => {
			const created = await prisma.task.create({
				data: {
					name,
					parentType: "task",
					parentTaskId,
					// defaults for status/estimatedTime/etc are fine
				},
				select: { id: true, name: true, parentTaskId: true },
			})
			return created
		},
	}),
	updateName: defineAction({
		input: z.object({
			id: z.coerce.number().int().positive(),
			name: z.string().min(1),
		}),
		handler: async ({ id, name }) => {
			return prisma.task.update({
				where: { id },
				data: { name },
				select: { id: true, name: true, parentTaskId: true },
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
