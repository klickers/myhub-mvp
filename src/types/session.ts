export type Session = {
	id: number
	itemType: "objective" | "bucket" | "task"
	objectiveId: number | null
	taskId: number | null
	startTime: Date
	endTime: Date | null
	notes: string
}
