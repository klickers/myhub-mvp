export type Session = {
	id: number
	itemType: "objective" | "bucket" | "block"
	objectiveId?: number | null
	taskId?: number | null
	startTime: Date
	endTime: Date | null
	notes: string | null
}
