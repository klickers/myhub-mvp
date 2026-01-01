import { defineAction } from "astro:actions"
import { z } from "zod"
import prisma from "@/helpers/prisma"

const guildInput = z.object({
	name: z.string().min(1),
	slug: z.string().min(1),
	description: z.string().nullable().optional(),
	status: z.enum([
		"notstarted",
		"archived",
		"inprogress",
		"onhold",
		"completed",
	]),
	personaId: z.coerce.number().int().nullable().optional(),
})

export const guild = {
	create: defineAction({
		accept: "form",
		input: guildInput,
		handler: async (input) => {
			return prisma.guild.create({
				data: {
					name: input.name,
					slug: input.slug,
					description: input.description ?? null,
					status: input.status,
					personaId: input.personaId ?? null,
				},
			})
		},
	}),
	update: defineAction({
		input: guildInput.extend({
			id: z.coerce.number().int(),
		}),
		handler: async ({ id, ...input }) => {
			return prisma.guild.update({
				where: { id },
				data: {
					name: input.name,
					slug: input.slug,
					description: input.description ?? null,
					status: input.status,
					personaId: input.personaId ?? null,
				},
			})
		},
	}),
	delete: defineAction({
		input: z.object({
			id: z.coerce.number().int(),
		}),
		handler: async ({ id }) => {
			return prisma.guild.delete({
				where: { id },
			})
		},
	}),
	getById: defineAction({
		input: z.object({
			id: z.coerce.number().int(),
		}),
		handler: async ({ id }) => {
			return prisma.guild.findUnique({
				where: { id },
				include: { persona: true },
			})
		},
	}),
	list: defineAction({
		handler: async () => {
			return prisma.guild.findMany({
				include: { persona: true },
				orderBy: { name: "asc" },
			})
		},
	}),
}
