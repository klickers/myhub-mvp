import { defineAction } from "astro:actions"
import { z } from "zod"
import { differenceInMinutes } from "date-fns"
import prisma from "@/helpers/prisma"

export const server = {
	// ===============================
	// Session
	// ===============================
	startSession: defineAction({
		input: z.object({
			itemType: z.enum(["bucket", "objective"]),
			itemId: z.number(),
		}),
		handler: async ({ itemType, itemId }) => {
			const data: any = {
				itemType,
				startTime: new Date(),
			}
			if (itemType === "objective") data.objectiveId = itemId
			return await prisma.session.create({ data })
		},
	}),
	endSession: defineAction({
		input: z.object({
			sessionId: z.number(),
		}),
		handler: async ({ sessionId }) => {
			return await prisma.session.update({
				where: { id: sessionId },
				data: { endTime: new Date() },
			})
		},
	}),
	// ===============================
	// KeyValue
	// ===============================
	getKeyValue: defineAction({
		input: z.object({
			key: z.string(),
		}),
		handler: async ({ key }) => {
			const result = await prisma.keyValue.findUnique({ where: { key } })
			return result?.value ?? null
		},
	}),
	setKeyValue: defineAction({
		input: z.object({
			key: z.string(),
			value: z.string(),
		}),
		handler: async ({ key, value }) => {
			const existing = await prisma.keyValue.findUnique({
				where: { key },
			})
			if (existing) {
				return await prisma.keyValue.update({
					where: { key },
					data: { value },
				})
			} else {
				return await prisma.keyValue.create({
					data: { key, value },
				})
			}
		},
	}),
	// ===============================
	// Bucket
	// ===============================
	getBuckets: defineAction({
		input: undefined,
		handler: async () => {
			return await prisma.bucket.findMany({ orderBy: { order: "asc" } })
		},
	}),
	getFullBucketsByWeek: defineAction({
		input: z.object({
			year: z.number(),
			weekNumber: z.number(),
			weekStart: z.coerce.date(),
			weekEnd: z.coerce.date(),
		}),
		handler: async ({ year, weekNumber, weekStart, weekEnd }) => {
			// getBuckets()
			const buckets = await prisma.bucket.findMany({
				orderBy: { order: "asc" },
			})
			// getActiveObjectives()
			const objectives = await prisma.objective.findMany({
				where: {
					bucketId: { in: buckets.map((b) => b.id) },
					status: { notIn: ["archived", "completed"] },
				},
			})
			// getObjectiveTimesByWeek()
			const times = await prisma.timePerWeek.findMany({
				where: {
					year,
					weekNumber,
					itemType: "objective",
					objectiveId: { in: objectives.map((o) => o.id) },
				},
			})
			// getSessionsByWeek
			const sessions = await prisma.session.findMany({
				where: {
					itemType: "objective",
					startTime: { gte: weekStart, lte: weekEnd },
					endTime: { not: null },
				},
			})
			const timesByObjective: Record<number, number> = {}
			for (const t of times) {
				timesByObjective[t.objectiveId!] = t.scheduledTime
			}
			const sessionsByObjective: Record<number, any[]> = {}
			for (const ses of sessions) {
				if (!sessionsByObjective[ses.objectiveId!])
					sessionsByObjective[ses.objectiveId!] = []
				sessionsByObjective[ses.objectiveId!].push(ses)
			}
			const objectivesByBucket: Record<number, any[]> = {}
			for (const obj of objectives) {
				if (!objectivesByBucket[obj.bucketId])
					objectivesByBucket[obj.bucketId] = []
				objectivesByBucket[obj.bucketId].push({
					...obj,
					scheduledTime: timesByObjective[obj.id] ?? 0,
					sessions: sessionsByObjective[obj.id] ?? [],
					usedTime: sessionsByObjective[obj.id]
						? sessionsByObjective[obj.id].reduce(
								(acc, { startTime, endTime }) =>
									acc +
									differenceInMinutes(endTime, startTime),
								0
						  )
						: 0,
				})
			}
			return buckets.map((bucket) => ({
				...bucket,
				objectives: objectivesByBucket[bucket.id] ?? [],
				totalScheduledTime: objectivesByBucket[bucket.id]
					? objectivesByBucket[bucket.id].reduce(
							(acc, { scheduledTime }) => acc + scheduledTime,
							0
					  )
					: 0,
				totalUsedTime: objectivesByBucket[bucket.id]
					? objectivesByBucket[bucket.id].reduce(
							(acc, { usedTime }) => acc + usedTime,
							0
					  )
					: 0,
			}))
		},
	}),
	// ===============================
	// Session
	// ===============================
	getSessionsByWeek: defineAction({
		input: z.object({
			weekStart: z.coerce.date(),
			weekEnd: z.coerce.date(),
		}),
		handler: async ({ weekStart, weekEnd }) => {
			return await prisma.session.findMany({
				where: {
					itemType: "objective",
					startTime: { gte: weekStart, lte: weekEnd },
					endTime: { not: null },
				},
			})
		},
	}),
}
