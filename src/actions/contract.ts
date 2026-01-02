import { defineAction } from "astro:actions"
import { z } from "zod"
import prisma from "@/helpers/prisma"
import { Status } from "@/generated/prisma/enums"

const contractInput = z.object({
	name: z.string().min(1),
	slug: z.string().min(1),
	description: z.string().nullable().optional(),
	dueDate: z.string(),
	status: z.nativeEnum(Status),
	guildId: z.coerce.number().int().nullable().optional(),
})

export const contract = {
	create: defineAction({
		accept: "form",
		input: contractInput,
		handler: async (input) => {
			return prisma.contract.create({
				data: {
					name: input.name,
					slug: input.slug,
					description: input.description ?? null,
					dueDate: new Date(input.dueDate),
					status: input.status,
					guildId: input.guildId ?? null,
				},
			})
		},
	}),
	update: defineAction({
		accept: "form",
		input: contractInput.extend({
			id: z.coerce.number().int(),
		}),
		handler: async ({ id, ...input }) => {
			return prisma.contract.update({
				where: { id },
				data: {
					name: input.name,
					slug: input.slug,
					description: input.description ?? null,
					dueDate: new Date(input.dueDate),
					status: input.status,
					guildId: input.guildId ?? null,
				},
			})
		},
	}),
	delete: defineAction({
		input: z.object({
			id: z.coerce.number().int(),
		}),
		handler: async ({ id }) => {
			return prisma.contract.delete({
				where: { id },
			})
		},
	}),
	getBySlug: defineAction({
		input: z.object({
			slug: z.string(),
		}),
		handler: async ({ slug }) => {
			return prisma.contract.findUnique({
				where: { slug },
				include: { guild: true },
			})
		},
	}),
	list: defineAction({
		input: z.object({
			status: z
				.array(z.nativeEnum(Status))
				.optional()
				.default([Status.inprogress]),
			withGuild: z.boolean().optional().default(false),
		}),
		handler: async ({ status, withGuild }) => {
			return prisma.contract.findMany({
				where: {
					status: { in: status },
				},
				include: { guild: withGuild },
				orderBy: { dueDate: "asc" },
			})
		},
	}),
	listByGuild: defineAction({
		input: z.object({
			guildId: z.coerce.number().int(),
			status: z
				.array(z.nativeEnum(Status))
				.optional()
				.default([Status.inprogress]),
		}),
		handler: async ({ guildId, status }) => {
			return prisma.contract.findMany({
				where: {
					guildId,
					status: { in: status },
				},
				orderBy: { dueDate: "asc" },
			})
		},
	}),
}
