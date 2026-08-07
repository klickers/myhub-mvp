import { defineAction } from "astro:actions"
import { z } from "zod"
import prisma from "@/helpers/prisma"

export const session = {
	list: defineAction({
		input: z.object({
			from: z.coerce.date().optional(),
			to: z.coerce.date().optional(),
			withFullTask: z.boolean().optional(),
			take: z.number().optional(),
		}),
		handler: async ({ from, to, withFullTask, take }) => {
			return prisma.session.findMany({
				...(from != null && to != null
					? {
							where: {
								startTime: { lte: to },
								endTime: { not: null, gte: from },
							},
						}
					: {
							where: {
								endTime: { not: null },
							},
						}),
				...(take != null ? { take } : {}),
				orderBy: {
					endTime: "desc",
				},
				include: {
					objective: {
						select: { id: true, name: true, slug: true },
					},
					guild: {
						select: { id: true, name: true, slug: true },
					},
					contract: {
						select: { id: true, name: true, slug: true },
					},
					experiment: {
						select: { id: true, name: true, slug: true },
					},
					task: withFullTask ?? {
						select: { id: true, name: true },
					},
				},
			})
		},
	}),
}
