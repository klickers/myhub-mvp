import { defineAction } from "astro:actions"
import { z } from "zod"
import prisma from "@/helpers/prisma"

export const session = {
	list: defineAction({
		input: z.object({}),
		handler: async () => {
			return prisma.session.findMany({
				where: {
					endTime: {
						not: null,
					},
				},
				take: 5,
				orderBy: {
					endTime: "desc",
				},
				include: {
					objective: {
						select: { id: true, name: true },
					},
					guild: {
						select: { id: true, name: true },
					},
					contract: {
						select: { id: true, name: true },
					},
					experiment: {
						select: { id: true, name: true },
					},
					task: {
						select: { id: true, name: true },
					},
				},
			})
		},
	}),
}
