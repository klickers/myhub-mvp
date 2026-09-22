import type { Prisma } from "@/generated/prisma/client"

export type TagWithChildren = Prisma.TagGetPayload<{
	include: {
		children: true
	}
}>

export type TaskWithTags = Prisma.TaskGetPayload<{
	include: {
		tags: {
			include: {
				tag: true
			}
		}
	}
}>

export type TaskNode = TaskWithTags & {
	subtasks: TaskNode[]
}

export type AgendaWithIncludes = Prisma.AgendaGetPayload<{
	include: {
		tag: true
		task: true
	}
}>
