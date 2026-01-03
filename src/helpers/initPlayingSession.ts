import { playingSession } from "@/stores/playingSession"
import { actions } from "astro:actions"

export const initPlayingSession = async () => {
	const id = await actions.getKeyValue.orThrow({
			key: "playingSessionId",
		}),
		isPlaying = await actions.getKeyValue.orThrow({
			key: "isSessionPlaying",
		}),
		itemType = await actions.getKeyValue.orThrow({
			key: "playingSessionItemType",
		}),
		itemId = await actions.getKeyValue.orThrow({
			key: "playingSessionItemId",
		}),
		startTime = await actions.getKeyValue.orThrow({
			key: "playingSessionStartTime",
		})

	playingSession.set({
		id: parseInt(id || "0"),
		isPlaying: isPlaying === "true",
		itemType: itemType,
		itemId: parseInt(itemId || "0"),
		startTime: startTime ? new Date(startTime) : null,
	})
}
