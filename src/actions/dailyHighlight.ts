import { defineAction } from "astro:actions"
import { z } from "zod"
import prisma from "@/helpers/prisma"
import { addDays } from "date-fns"

const dailyHighlightInput = z.object({
	date: z.coerce.date(),
	highlight: z.string().nullable().optional(),
})

export const dailyHighlight = {
	listInRange: defineAction({
		input: z.object({
			from: z.coerce.date().optional(),
			to: z.coerce.date().optional(),
		}),
		handler: async ({ from, to }) => {
			return prisma.dailyHighlight.findMany({
				where: {
					date: {
						gte: from && addDays(from, -1),
						lte: to && addDays(to, 1),
					},
				},
			})
		},
	}),
	upsert: defineAction({
		input: dailyHighlightInput,
		handler: async ({ date, highlight }) => {
			return prisma.dailyHighlight.upsert({
				where: { date },
				create: { date, highlight },
				update: { highlight },
			})
		},
	}),
}
