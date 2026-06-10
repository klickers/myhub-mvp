import { defineAction } from "astro:actions"
import { z } from "zod"
import prisma from "@/helpers/prisma"
import type { Status, Task } from "@/generated/prisma/client"

type SearchResultType =
	| "guild"
	| "contract"
	| "experiment"
	| "category"
	| "task"

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
	guild: 0,
	contract: 1,
	experiment: 2,
	category: 3,
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

			const [guilds, contracts, experiments, categories, tasks] =
				await Promise.all([
					prisma.guild.findMany({
						where,
						select: {
							id: true,
							name: true,
							slug: true,
							status: true,
						},
						take: RESULT_LIMIT,
					}),
					prisma.contract.findMany({
						where,
						select: {
							id: true,
							name: true,
							slug: true,
							status: true,
						},
						take: RESULT_LIMIT,
					}),
					prisma.experiment.findMany({
						where,
						select: {
							id: true,
							name: true,
							slug: true,
							status: true,
						},
						take: RESULT_LIMIT,
					}),
					prisma.category.findMany({
						where,
						select: {
							id: true,
							name: true,
							slug: true,
						},
						take: RESULT_LIMIT,
					}),
					prisma.task.findMany({
						where,
						take: RESULT_LIMIT,
					}),
				])

			const results: GlobalSearchResult[] = [
				...guilds.map((guild) => ({
					id: guild.id,
					type: "guild" as const,
					title: guild.name,
					status: guild.status,
					href: `/hall/guilds/${guild.slug}`,
				})),
				...contracts.map((contract) => ({
					id: contract.id,
					type: "contract" as const,
					title: contract.name,
					status: contract.status,
					href: `/hall/contracts/${contract.slug}`,
				})),
				...experiments.map((experiment) => ({
					id: experiment.id,
					type: "experiment" as const,
					title: experiment.name,
					status: experiment.status,
					href: `/lab/experiments/${experiment.slug}`,
				})),
				...categories.map((category) => ({
					id: category.id,
					type: "category" as const,
					title: category.name,
					status: "active" as const,
					href: `/lab#category-${category.slug}`,
				})),
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
