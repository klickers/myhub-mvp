import { defineAction } from "astro:actions"
import { z } from "zod"
import prisma from "@/helpers/prisma"

const agendaInput = z
	.object({
		date: z.coerce.date(),
		scheduledTime: z.coerce.number().int().optional().default(0),
		description: z.string().optional().default(""),
		// status: z.string().optional().default("notstarted"),
		tagId: z.coerce.number().int().nullable().optional(),
		taskId: z.coerce.number().int().nullable().optional(),
	})
	.superRefine((data, ctx) => {
		if (
			(data.tagId && data.taskId) ||
			(data.tagId === null && data.taskId === null)
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message:
					"You must provide exactly one of tagId or taskId, or neither.",
			})
		}
	})

export const agenda = {
	create: defineAction({
		input: agendaInput,
		handler: async (input) => {
			return prisma.agenda.create({
				data: {
					date: input.date,
					scheduledTime: input.scheduledTime,
					description: input.description,
					tagId: input.tagId ?? undefined,
					taskId: input.taskId ?? undefined,
				},
				include: {
					tag: true,
					task: {
						include: {
							tags: true,
						},
					},
				},
			})
		},
	}),

	getBetweenRange: defineAction({
		input: z.object({
			start: z.coerce.date(),
			end: z.coerce.date(),
		}),
		handler: async ({ start, end }) => {
			return prisma.agenda.findMany({
				where: {
					date: {
						gte: new Date(start),
						lt: new Date(end),
					},
				},
				include: {
					tag: true,
					task: {
						include: {
							tags: true,
						},
					},
				},
			})
		},
	}),
}
