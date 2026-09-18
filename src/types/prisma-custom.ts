import type { Prisma } from "@/generated/prisma/client"

export type TagWithChildren = Prisma.TagGetPayload<{
	include: {
		children: true
	}
}>
