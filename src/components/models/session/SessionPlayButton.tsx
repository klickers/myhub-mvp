import React from "react"
import { useStore } from "@nanostores/react"
import { Icon } from "@iconify/react"
import { actions } from "astro:actions"
import { playingSession } from "@/stores/playingSession"

interface Props {
	itemType: "objective" | "task"
	itemId: number
}

const SessionPlayButton: React.FC<Props> = ({ itemType, itemId }) => {
	const $playingSession = useStore(playingSession)
	const isCurrentlyPlaying =
		$playingSession.isPlaying && $playingSession.objectiveId == itemId

	const endCurrentSession = async () => {
		const { data, error } = await actions.getKeyValue({
			key: "playingSessionId",
		})
		if (data) {
			await actions.endSession({ sessionId: parseInt(data) })
			await actions.setKeyValue({
				key: "isSessionPlaying",
				value: "false",
			})
			await actions.setKeyValue({
				key: "playingSessionObjectiveId",
				value: "0",
			})
			playingSession.set({
				id: 0,
				isPlaying: false,
				objectiveId: 0,
				startTime: null,
			})
		} else if (error)
			console.error("Error retrieving ending session:", error)
	}

	const startSession = async () => {
		const { data, error } = await actions.startSession({
			itemType: itemType,
			itemId: itemId,
		})
		if (error) console.error("Error starting session:", error)
		else {
			await actions.setKeyValue({
				key: "isSessionPlaying",
				value: "true",
			})
			await actions.setKeyValue({
				key: "playingSessionId",
				value: data.id.toString(),
			})
			await actions.setKeyValue({
				key: "playingSessionObjectiveId",
				value: itemId.toString(),
			})
			await actions.setKeyValue({
				key: "playingSessionStartTime",
				value: new Date().toISOString(),
			})
			playingSession.set({
				id: data.id,
				isPlaying: true,
				objectiveId: itemId,
				startTime: new Date(),
			})
		}
	}

	const handleClick = async () => {
		if ($playingSession.isPlaying) {
			if (isCurrentlyPlaying) await endCurrentSession()
			else {
				await endCurrentSession()
				await startSession()
			}
			// TODO: update $bucket.objectives.sessions to include new session
			// TODO: clear editor
		} else await startSession()
	}

	return (
		<button onClick={handleClick}>
			<Icon
				icon={
					isCurrentlyPlaying
						? "pixelarticons:pause"
						: "pixelarticons:play"
				}
			/>
		</button>
	)
}

export default SessionPlayButton
