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
		agendas: true
	}
}>

export type TaskNode = TaskWithTags & {
	subtasks: TaskNode[]
}

export type AgendaWithIncludes = Prisma.AgendaGetPayload<{
	include: {
		tag: true
		task: {
			include: {
				tags: true
			}
		}
	}
}>
