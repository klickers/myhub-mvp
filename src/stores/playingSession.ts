import { atom } from "nanostores"

type playing = {
	id: number
	isPlaying: boolean
	objectiveId: number
	startTime: null | Date
}

export const playingSession = atom<playing>({
	id: 0,
	isPlaying: false,
	objectiveId: 0,
	startTime: null,
})
