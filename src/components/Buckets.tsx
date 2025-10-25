import React, { useState } from "react"
import SessionPlayer from "@/components/SessionPlayer"
import { minutesToDots } from "@/helpers/time/minutesToDots"

interface Props {
	buckets: {
		id: number
		name: string
		totalScheduledTime: number
		totalUsedTime: number
		objectives: {
			id: number
			name: string
			scheduledTime: number
			usedTime: number
		}[]
	}[]
	playingSessionObjectiveId: number | null
}

const Buckets: React.FC<Props> = ({ buckets, playingSessionObjectiveId }) => {
	const [activeItemId, setActiveItemId] = useState(playingSessionObjectiveId)

	const handleActivate = (id: number) => setActiveItemId(id)

	return (
		<>
			{buckets.map((bucket) => (
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
											{/* TODO: show added time from the week */}
											{minutesToDots(obj.usedTime) +
												"/" +
												minutesToDots(
													obj.scheduledTime
												)}
										</p>
										<SessionPlayer
											itemType="objective"
											itemId={obj.id}
											isPlaying={activeItemId === obj.id}
											setActiveItemid={handleActivate}
										/>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			))}
		</>
	)
}

export default Buckets
