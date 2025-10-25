import type { Objective } from "@/types/objective"

export type Bucket = {
	id: number
	name: string
	totalScheduledTime: number
	totalUsedTime: number
	objectives: Objective[]
}
