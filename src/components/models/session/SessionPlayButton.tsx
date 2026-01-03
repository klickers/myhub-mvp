import React from "react"
import { useStore } from "@nanostores/react"
import { Icon } from "@iconify/react"
import { actions } from "astro:actions"
import { playingSession } from "@/stores/playingSession"
import type { SessionItemType } from "@/generated/prisma/enums"

interface Props {
	itemType: SessionItemType
	itemId: number
}

const SessionPlayButton: React.FC<Props> = ({ itemType, itemId }) => {
	const $playingSession = useStore(playingSession)
	const isCurrentlyPlaying =
		$playingSession.isPlaying &&
		$playingSession.itemType == itemType &&
		$playingSession.itemId == itemId

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
				key: "playingSessionItemId",
				value: "0",
			})
			playingSession.set({
				id: 0,
				isPlaying: false,
				itemType: "task",
				itemId: 0,
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
				key: "playingSessionItemType",
				value: itemType,
			})
			await actions.setKeyValue({
				key: "playingSessionItemId",
				value: itemId.toString(),
			})
			await actions.setKeyValue({
				key: "playingSessionStartTime",
				value: new Date().toISOString(),
			})
			playingSession.set({
				id: data.id,
				isPlaying: true,
				itemType,
				itemId,
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
		<button
			onClick={handleClick}
			className="p-1"
		>
			<Icon
				icon={
					isCurrentlyPlaying
						? "mingcute:pause-fill"
						: "mingcute:play-fill"
				}
			/>
		</button>
	)
}

export default SessionPlayButton
