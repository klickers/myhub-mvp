import React from "react"
import { Icon } from "@iconify/react"
import { actions } from "astro:actions"

interface Props {
	itemType: "bucket" | "objective"
	itemId: number
	isPlaying: boolean | null
	setActiveItemid: (id: number) => void
}

const SessionPlayer: React.FC<Props> = ({
	itemType,
	itemId,
	isPlaying,
	setActiveItemid,
}) => {
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
		} else if (error)
			console.error("Error retrieving ending session:", error)
	}

	const handleClick = async () => {
		await endCurrentSession()
		if (isPlaying) {
			setActiveItemid(0)
		} else {
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
					value: data[0].id.toString(),
				})
				await actions.setKeyValue({
					key: "playingSessionObjectiveId",
					value: itemId.toString(),
				})
			}
			setActiveItemid(itemId) // notify parent
		}
	}

	return (
		<button onClick={handleClick}>
			<Icon
				icon={isPlaying ? "pixelarticons:pause" : "pixelarticons:play"}
			/>
		</button>
	)
}

export default SessionPlayer
