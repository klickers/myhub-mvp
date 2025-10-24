import { defineAction } from "astro:actions"
import { db, Session, KeyValue, eq } from "astro:db"
import { z } from "astro:schema"

export const server = {
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
}
