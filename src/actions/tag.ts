import { defineAction } from "astro:actions"
import { z } from "zod"
import prisma from "@/helpers/prisma"
import { TagType } from "@/generated/prisma/enums"

const tagInput = z.object({
	name: z.string().min(1),
	slug: z.string().min(1),
	type: z.nativeEnum(TagType),
	order: z.coerce.number().int().optional(),
	visibility: z.boolean().default(true).optional(),
	parentId: z.coerce.number().int().nullable().optional(),
})

export const tag = {
	create: defineAction({
		input: tagInput,
		handler: async (input) => {
			let order = input.order
			if (!order) {
				const last = await prisma.tag.aggregate({
					where: {
						parentId: input.parentId ?? null,
					},
					_max: {
						order: true,
					},
				})
				order = (last._max.order ?? -1) + 1
			}
			return prisma.tag.create({
				data: {
					name: input.name,
					slug: input.slug,
					type: input.type,
					order,
					visibility: input.visibility,
					parentId: input.parentId ?? null,
				},
			})
		},
	}),

	getAllTagGroups: defineAction({
		input: z.object({}),
		handler: async () => {
			return prisma.tag.findMany({
				where: { type: "group" },
				orderBy: { order: "asc" },
				include: {
					children: {
						orderBy: { order: "asc" },
					},
				},
			})
		},
	}),
}
