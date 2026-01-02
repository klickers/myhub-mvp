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
					deadline: new Date(input.deadline as Date),
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
	// update: defineAction({
	// 	accept: "form",
	// 	input: taskInput.extend({
	// 		id: z.coerce.number().int(),
	// 	}),
	// 	handler: async ({ id, ...input }) => {
	// 		return prisma.task.update({
	// 			where: { id },
	// 			data: {
	// 				name: input.name,
	// 				slug: input.slug,
	// 				description: input.description ?? null,
	// 				dueDate: new Date(input.dueDate),
	// 				status: input.status,
	// 				guildId: input.guildId ?? null,
	// 			},
	// 		})
	// 	},
	// }),
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
}
