import { defineAction } from "astro:actions"
import { z } from "zod"
import prisma from "@/helpers/prisma"

const categoryInput = z.object({
	name: z.string().min(1),
	slug: z.string().min(1),
})

export const category = {
	create: defineAction({
		accept: "form",
		input: categoryInput,
		handler: async (input) => {
			return prisma.category.create({
				data: {
					name: input.name,
					slug: input.slug,
				},
			})
		},
	}),

	update: defineAction({
		accept: "form",
		input: categoryInput.extend({
			id: z.coerce.number().int(),
		}),
		handler: async ({ id, ...input }) => {
			return prisma.category.update({
				where: { id },
				data: {
					name: input.name,
					slug: input.slug,
				},
			})
		},
	}),

	delete: defineAction({
		input: z.object({
			id: z.coerce.number().int(),
		}),
		handler: async ({ id }) => {
			return prisma.category.delete({
				where: { id },
			})
		},
	}),

	getById: defineAction({
		input: z.object({
			id: z.number(),
		}),
		handler: async ({ id }) => {
			return prisma.category.findUnique({
				where: { id },
				include: { experiments: true },
			})
		},
	}),

	getBySlug: defineAction({
		input: z.object({
			slug: z.string(),
		}),
		handler: async ({ slug }) => {
			return prisma.category.findUnique({
				where: { slug },
				include: { experiments: true },
			})
		},
	}),

	list: defineAction({
		input: z.object({
			withExperiments: z.boolean().optional().default(false),
		}),
		handler: async ({ withExperiments }) => {
			return prisma.category.findMany({
				include: {
					experiments: withExperiments,
				},
				orderBy: { name: "asc" },
			})
		},
	}),
}
