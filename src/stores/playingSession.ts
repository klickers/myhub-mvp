import { atom } from "nanostores"

type playing = {
	id: number
	isPlaying: boolean
	itemType: "objective" | "guild" | "contract" | "experiment" | "task"
	itemId: number
	// objectiveId: number
	startTime: null | Date
}

export const playingSession = atom<playing>({
	id: 0,
	isPlaying: false,
	itemType: "task",
	itemId: 0,
	// objectiveId: 0,
	startTime: null,
})
