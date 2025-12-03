import React, { useEffect, useState } from "react"
import SessionPlayButton from "@/components/models/session/SessionPlayButton"
import { minutesToDots } from "@/helpers/time/minutesToDots"
import { useStore } from "@nanostores/react"
import { buckets } from "@/stores/buckets"
import { playingSession } from "@/stores/playingSession"
import { differenceInSeconds } from "date-fns"
import { actions } from "astro:actions"
import { secondsToDots } from "@/helpers/time/secondsToDots"

const Buckets: React.FC = () => {
	const $buckets = useStore(buckets)
	const $playingSession = useStore(playingSession)

	const [sessionUsedTime, setSessionUsedTime] = useState<string>("00:00:00")

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
				}),
				startTime = await actions.getKeyValue.orThrow({
					key: "playingSessionStartTime",
				})

			playingSession.set({
				id: parseInt(id || "0"),
				isPlaying: isPlaying === "true",
				objectiveId: parseInt(objectiveId || "0"),
				startTime: startTime ? new Date(startTime) : null,
			})
		}
		initPlayingSession()
	}, [])

	// ---------------------------------------------------
	// Update timer display
	// ---------------------------------------------------
	useEffect(() => {
		if (!$playingSession.startTime || !$playingSession.objectiveId) return
		const interval = setInterval(() => {
			setSessionUsedTime(
				secondsToDots(
					differenceInSeconds(new Date(), $playingSession.startTime!)
				)
			)
		}, 1000)
		return () => clearInterval(interval)
	}, [$playingSession])

	return (
		<div className="grid grid-cols-1 gap-6 mt-6 mb-10">
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
						{bucket.objectives.map((obj) => {
							const usedTime =
								$playingSession.objectiveId === obj.id &&
								$playingSession.startTime
									? sessionUsedTime ??
									  secondsToDots(obj.usedTime * 60)
									: minutesToDots(obj.usedTime)

							return (
								<div
									key={obj.id}
									className="mb-2 py-2 pl-4 pr-3 border border-black"
								>
									<div className="flex justify-between items-center">
										<div className="font-mono text-xs pr-3">
											{obj.id < 10
												? "0" + obj.id
												: obj.id}
										</div>
										<a
											href={"/objectives/" + obj.slug}
											className="flex-1"
										>
											<p>{obj.name}</p>
										</a>
										<div className="flex gap-2">
											<p className="text-xs font-mono">
												{usedTime +
													"/" +
													minutesToDots(
														obj.scheduledTime
													)}
											</p>
											<SessionPlayButton
												itemType="objective"
												itemId={obj.id}
											/>
										</div>
									</div>
								</div>
							)
						})}
					</div>
				</div>
			))}
		</div>
	)
}

export default Buckets
