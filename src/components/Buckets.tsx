import React, { useEffect } from "react"
import SessionPlayer from "@/components/SessionPlayer"
import { minutesToDots } from "@/helpers/time/minutesToDots"
import { useStore } from "@nanostores/react"
import { buckets } from "@/stores/buckets"
import { playingSession } from "@/stores/playingSession"
import { actions } from "astro:actions"

const Buckets: React.FC = () => {
	const $buckets = useStore(buckets)

	useEffect(() => {
		const initPlayingSession = async () => {
			const id = await actions.getKeyValue.orThrow({
					key: "playingSessionId",
				}),
				isPlaying = await actions.getKeyValue.orThrow({
					key: "isSessionPlaying",
				}),
				objectiveId = await actions.getKeyValue.orThrow({
					key: "playingSessionObjectiveId",
				})
			playingSession.set({
				id: parseInt(id || "0"),
				isPlaying: isPlaying === "true" ? true : false,
				objectiveId: parseInt(objectiveId || "0"),
			})
		}
		initPlayingSession()
	}, [])

	return (
		<div className="grid grid-cols-3 gap-6 mt-6 mb-20">
			{Object.values($buckets).map((bucket) => (
				<div
					key={bucket.id}
					className="p-6 bg-white border border-black"
					style={{ boxShadow: "5px 5px 0px 0px black" }}
				>
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-lg font-semibold">{bucket.name}</h2>
						<p className="font-mono">
							{minutesToDots(bucket.totalUsedTime) +
								"/" +
								minutesToDots(bucket.totalScheduledTime)}
						</p>
					</div>
					<div>
						{bucket.objectives.map((obj) => (
							<div
								key={obj.id}
								className="mb-2 py-2 pl-4 pr-3 border border-black"
							>
								<div className="flex justify-between items-center">
									<p>{obj.name}</p>
									<div className="flex gap-2">
										<p className="text-xs font-mono">
											{minutesToDots(obj.usedTime) +
												"/" +
												minutesToDots(
													obj.scheduledTime
												)}
										</p>
										<SessionPlayer
											itemType="objective"
											itemId={obj.id}
										/>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	)
}

export default Buckets
