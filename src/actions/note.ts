import { defineAction } from "astro:actions"
import { z } from "zod"
import prisma from "@/helpers/prisma"

export const note = {
	getById: defineAction({
		input: z.object({
			id: z.coerce.number().int(),
		}),
		handler: async ({ id }) => {
			return prisma.note.findUnique({
				where: { id },
			})
		},
	}),
	getAll: defineAction({
		input: z.void(),
		handler: async () => {
			return prisma.note.findMany({
				include: {
					items: {
						select: {
							taskId: true,
						},
					},
				},
			})
		},
	}),

	create: defineAction({
		input: z.object({
			title: z.string().optional(),
			taskId: z.number().optional(),
		}),
		handler: async (data) => {
			return prisma.note.create({
				data: {
					title: data.title,
					items: data.taskId
						? {
								create: {
									taskId: data.taskId,
								},
							}
						: undefined,
				},
			})
		},
	}),
	update: defineAction({
		input: z.object({
			id: z.coerce.number().int(),
			title: z.string().optional(),
			content: z.array(z.any()).optional(),
		}),
		handler: async (data) => {
			return prisma.note.update({
				where: { id: data.id },
				data: {
					title: data.title,
					content: data.content,
				},
			})
		},
	}),
	delete: defineAction({
		input: z.object({
			id: z.coerce.number().int(),
		}),
		handler: async ({ id }) => {
			return prisma.note.delete({
				where: { id },
				include: {
					items: {
						select: {
							taskId: true,
						},
					},
				},
			})
		},
	}),
}
