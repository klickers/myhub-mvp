import { defineAction } from "astro:actions"
import {
	db,
	Session,
	KeyValue,
	eq,
	Bucket,
	asc,
	Objective,
	and,
	inArray,
	notInArray,
	TimePerWeek,
	gte,
	lte,
	isNotNull,
} from "astro:db"
import { z } from "astro:schema"
import { differenceInMinutes } from "date-fns"

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
			return await db.insert(Session).values(data).returning()
		},
	}),
	endSession: defineAction({
		input: z.object({
			sessionId: z.number(),
		}),
		handler: async ({ sessionId }) => {
			return await db
				.update(Session)
				.set({ endTime: new Date() })
				.where(eq(Session.id, sessionId))
				.returning()
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
			const result = await db
				.select()
				.from(KeyValue)
				.where(eq(KeyValue.key, key))
				.limit(1)
			return result.length > 0 ? result[0].value : null
		},
	}),
	setKeyValue: defineAction({
		input: z.object({
			key: z.string(),
			value: z.string(),
		}),
		handler: async ({ key, value }) => {
			const existing = await db
				.select()
				.from(KeyValue)
				.where(eq(KeyValue.key, key))
				.limit(1)
			if (existing.length > 0) {
				return await db
					.update(KeyValue)
					.set({ value })
					.where(eq(KeyValue.key, key))
					.returning()
			} else {
				return await db
					.insert(KeyValue)
					.values({ key, value })
					.returning()
			}
		},
	}),
	// ===============================
	// Bucket
	// ===============================
	getBuckets: defineAction({
		input: undefined,
		handler: async () => {
			return await db.select().from(Bucket).orderBy(asc(Bucket.order))
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
			const buckets = await db
				.select()
				.from(Bucket)
				.orderBy(asc(Bucket.order))
			// getActiveObjectives()
			const objectives = await db
				.select()
				.from(Objective)
				.where(
					and(
						inArray(
							Objective.bucketId,
							buckets.map((b) => b.id)
						),
						notInArray(Objective.status, ["archived", "completed"])
					)
				)
			// getObjectiveTimesByWeek()
			const times = await db
				.select()
				.from(TimePerWeek)
				.where(
					and(
						eq(TimePerWeek.year, year),
						eq(TimePerWeek.weekNumber, weekNumber),
						eq(TimePerWeek.itemType, "objective"),
						inArray(
							TimePerWeek.objectiveId,
							objectives.map((o) => o.id)
						)
					)
				)
			// getSessionsByWeek
			const sessions = await db
				.select()
				.from(Session)
				.where(
					and(
						eq(Session.itemType, "objective"),
						gte(Session.startTime, weekStart),
						lte(Session.startTime, weekEnd),
						isNotNull(Session.endTime)
					)
				)
			const timesByObjective: Record<number, number> = {}
			for (const t of times) {
				timesByObjective[t.objectiveId] = t.scheduledTime
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
}
