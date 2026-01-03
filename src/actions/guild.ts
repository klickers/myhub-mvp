import { defineAction } from "astro:actions"
import { z } from "zod"
import prisma from "@/helpers/prisma"
import { Status } from "@/generated/prisma/enums"

const guildInput = z.object({
	name: z.string().min(1),
	slug: z.string().min(1),
	description: z.string().nullable().optional(),
	status: z.nativeEnum(Status),
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
		accept: "form",
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
	getBySlug: defineAction({
		input: z.object({
			slug: z.string(),
		}),
		handler: async ({ slug }) => {
			return prisma.guild.findUnique({
				where: { slug },
				include: { persona: true },
			})
		},
	}),
	list: defineAction({
		handler: async () => {
			return prisma.guild.findMany({
				where: {
					status: {
						notIn: [Status.onhold, Status.archived],
					},
				},
				include: { persona: true },
				orderBy: { name: "asc" },
			})
		},
	}),
}
