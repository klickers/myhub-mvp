import { atom } from "nanostores"

export const playingSession = atom({
	id: 0,
	isPlaying: false,
	objectiveId: 0,
})
