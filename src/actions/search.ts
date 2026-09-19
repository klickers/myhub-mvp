import { defineAction } from "astro:actions"
import { z } from "zod"
import prisma from "@/helpers/prisma"
import type { Status, Task } from "@/generated/prisma/client"

type SearchResultType = "task"

type SearchResultStatus = Status | "active"

type SearchResultBase = {
	id: number
	title: string
	status: SearchResultStatus
	href: string
}

type NonTaskSearchResult = SearchResultBase & {
	type: Exclude<SearchResultType, "task">
}

type TaskSearchResult = SearchResultBase & {
	type: "task"
	task: Task
}

export type GlobalSearchResult = NonTaskSearchResult | TaskSearchResult

const RESULT_LIMIT = 12

const STATUS_RANK: Record<SearchResultStatus, number> = {
	notstarted: 0,
	inprogress: 1,
	onhold: 2,
	active: 3,
	completed: 4,
	archived: 5,
}

const TYPE_RANK: Record<SearchResultType, number> = {
	task: 4,
}

function sortResults(a: GlobalSearchResult, b: GlobalSearchResult) {
	const statusOrder = STATUS_RANK[a.status] - STATUS_RANK[b.status]
	if (statusOrder !== 0) return statusOrder

	const typeOrder = TYPE_RANK[a.type] - TYPE_RANK[b.type]
	if (typeOrder !== 0) return typeOrder

	return a.title.localeCompare(b.title)
}

export const search = {
	global: defineAction({
		input: z.object({
			query: z.string().trim().min(1).max(80),
		}),
		handler: async ({ query }) => {
			const where = {
				name: {
					contains: query,
					mode: "insensitive" as const,
				},
			}

			const [tasks] = await Promise.all([
				prisma.task.findMany({
					where,
					take: RESULT_LIMIT,
				}),
			])

			const results: GlobalSearchResult[] = [
				...tasks.map((task) => ({
					id: task.id,
					type: "task" as const,
					title: task.name,
					status: task.status,
					href: "#",
					task,
				})),
			]

			return results.sort(sortResults).slice(0, RESULT_LIMIT)
		},
	}),
}
