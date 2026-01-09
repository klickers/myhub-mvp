import { defineAction } from "astro:actions"
import { z } from "zod"
import prisma from "@/helpers/prisma"
import { Status } from "@/generated/prisma/enums"

const experimentInput = z.object({
	name: z.string().min(1),
	slug: z.string().min(1),
	description: z.string().nullable().optional(),
	status: z.nativeEnum(Status),
	categoryId: z.coerce.number().int().nullable().optional(),
})

export const experiment = {
	create: defineAction({
		accept: "form",
		input: experimentInput,
		handler: async (input) => {
			return prisma.experiment.create({
				data: {
					name: input.name,
					slug: input.slug,
					description: input.description ?? null,
					status: input.status,
					categoryId: input.categoryId ?? null,
				},
			})
		},
	}),

	update: defineAction({
		accept: "form",
		input: experimentInput.extend({
			id: z.coerce.number().int(),
		}),
		handler: async ({ id, ...input }) => {
			return prisma.experiment.update({
				where: { id },
				data: {
					name: input.name,
					slug: input.slug,
					description: input.description ?? null,
					status: input.status,
					categoryId: input.categoryId ?? null,
				},
			})
		},
	}),

	delete: defineAction({
		input: z.object({
			id: z.coerce.number().int(),
		}),
		handler: async ({ id }) => {
			return prisma.experiment.delete({
				where: { id },
			})
		},
	}),

	getById: defineAction({
		input: z.object({
			id: z.number(),
		}),
		handler: async ({ id }) => {
			return prisma.experiment.findUnique({
				where: { id },
				include: { category: true },
			})
		},
	}),

	getBySlug: defineAction({
		input: z.object({
			slug: z.string(),
		}),
		handler: async ({ slug }) => {
			return prisma.experiment.findUnique({
				where: { slug },
				include: { category: true },
			})
		},
	}),

	list: defineAction({
		input: z.object({
			status: z.array(z.nativeEnum(Status)).optional(),
			withCategory: z.boolean().optional().default(false),
		}),
		handler: async ({ status, withCategory }) => {
			return prisma.experiment.findMany({
				where: {
					...(status && { status: { in: status } }),
				},
				include: { category: withCategory },
				orderBy: { name: "asc" },
			})
		},
	}),

	listByCategory: defineAction({
		input: z.object({
			categoryId: z.coerce.number().int(),
			status: z
				.array(z.nativeEnum(Status))
				.optional()
				.default([Status.inprogress]),
		}),
		handler: async ({ categoryId, status }) => {
			return prisma.experiment.findMany({
				where: {
					categoryId,
					status: { in: status },
				},
				orderBy: { name: "asc" },
			})
		},
	}),

	listWithoutCategory: defineAction({
		input: z.object({
			status: z
				.array(z.nativeEnum(Status))
				.optional()
				.default([Status.inprogress]),
		}),
		handler: async ({ status }) => {
			return prisma.experiment.findMany({
				where: {
					categoryId: null,
					status: { in: status },
				},
				orderBy: { name: "asc" },
			})
		},
	}),
}
