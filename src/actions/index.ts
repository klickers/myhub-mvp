import { defineAction } from "astro:actions"
import { z } from "zod"
import { differenceInMinutes } from "date-fns"
import prisma from "@/helpers/prisma"
import { guild } from "./guild"
import { contract } from "./contract"
import { task } from "./task"
import { SessionItemType } from "@/generated/prisma/enums"
import { session } from "./session"
import { experiment } from "./experiment"
import { category } from "./category"

export const server = {
	guild,
	contract,
	task,
	session,
	experiment,
	category,
	// ===============================
	// Objective
	// ===============================
	getObjectiveById: defineAction({
		input: z.object({
			id: z.number(),
		}),
		handler: async ({ id }) => {
			return prisma.objective.findUnique({
				where: { id },
			})
		},
	}),
	// ===============================
	// Session
	// ===============================
	startSession: defineAction({
		input: z.object({
			itemType: z.nativeEnum(SessionItemType),
			itemId: z.number(),
		}),
		handler: async ({ itemType, itemId }) => {
			const data: any = {
				itemType,
				startTime: new Date(),
			}
			if (itemType === "objective") data.objectiveId = itemId
			else if (itemType == "guild") data.guildId = itemId
			else if (itemType == "contract") data.contractId = itemId
			else if (itemType == "experiment") data.experimentId = itemId
			else if (itemType == "task") data.taskId = itemId
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
	getSession: defineAction({
		input: z.object({
			id: z.number(),
		}),
		handler: async ({ id }) => {
			return prisma.session.findUnique({
				where: { id },
			})
		},
	}),
	updateSessionNotes: defineAction({
		input: z.object({
			id: z.number(),
			notes: z.string().optional(),
		}),
		handler: async ({ id, notes }) => {
			return await prisma.session.update({
				where: { id },
				data: { notes },
			})
		},
	}),
	updateSessionNotesJson: defineAction({
		input: z.object({
			id: z.number(),
			notesJson: z.array(z.any()).optional(),
		}),
		handler: async ({ id, notesJson }) => {
			return await prisma.session.update({
				where: { id },
				data: { notesJson },
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
	// Week
	// ===============================
	getWeek: defineAction({
		input: z.object({
			year: z.number(),
			weekNumber: z.number(),
		}),
		handler: async ({ year, weekNumber }) => {
			const result = await prisma.week.findUnique({
				where: { year_weekNumber: { year, weekNumber } },
				// include: {
				// 	timePerWeeks: true,
				// },
			})
			return result ?? null
		},
	}),
	createWeek: defineAction({
		input: z.object({
			year: z.number(),
			weekNumber: z.number(),
		}),
		handler: async ({ year, weekNumber }) => {
			return await prisma.week.create({
				data: {
					year,
					weekNumber,
				},
			})
		},
	}),
	getOrCreateWeek: defineAction({
		input: z.object({
			year: z.number(),
			weekNumber: z.number(),
		}),
		handler: async ({ year, weekNumber }) => {
			return await prisma.week.upsert({
				where: { year_weekNumber: { year, weekNumber } },
				create: { year, weekNumber },
				update: {},
			})
		},
	}),
	// ===============================
	// Time Per Week
	// ===============================
	createTimePerWeek: defineAction({
		input: z
			.object({
				year: z.number().int().positive(),
				weekNumber: z.number().int().min(1).max(53),
				itemType: z.enum(["bucket", "objective", "task"]),
				scheduledTime: z.number().int().min(0),
				objectiveId: z.number().int().optional(),
				taskId: z.number().int().optional(),
			})
			.refine(
				(data) =>
					(data.objectiveId && !data.taskId) ||
					(!data.objectiveId && data.taskId),
				{
					message:
						"You must provide exactly one of objectiveId or taskId",
					path: ["objectiveId", "taskId"],
				}
			),
		handler: async (request) => {
			const {
				year,
				weekNumber,
				itemType,
				scheduledTime,
				objectiveId,
				taskId,
			} = request

			// validation
			if (!year || !weekNumber)
				throw new Error("Missing required fields: year, weekNumber")
			if (!itemType) throw new Error("Missing required field: itemType")
			if (scheduledTime == null)
				throw new Error("Missing required field: scheduledTime")

			// check for objectiveId or taskId
			const hasObjective = typeof objectiveId === "number"
			const hasTask = typeof taskId === "number"
			if (hasObjective === hasTask)
				throw new Error(
					"You must provide exactly one of objectiveId or taskId."
				)

			// insert data
			const data: any = {
				year,
				weekNumber,
				itemType,
				scheduledTime,
				// completed: false,
			}
			if (hasObjective) data.objectiveId = objectiveId
			if (hasTask) data.taskId = taskId
			// try {
			// 	const record = await prisma.timePerWeek.create({ data })
			// 	return { success: true, record }
			// } catch (err: any) {
			// 	console.error(err)
			// 	throw new Error("Failed to create TimePerWeek entry.")
			// }
			return await prisma.timePerWeek.create({ data })
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
	// ===============================
	// Google Calendar IDs
	// ===============================
	getGoogleCalendarIds: defineAction({
		input: undefined,
		handler: async () => {
			return await prisma.googleCalendarId.findMany()
		},
	}),
	// ===============================
	// Business Hours
	// ===============================
	getBusinessHours: defineAction({
		input: undefined,
		handler: async () => {
			return await prisma.businessHours.findMany()
		},
	}),
}
