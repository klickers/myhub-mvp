import { differenceInMinutes } from "date-fns"
import { useStore } from "@nanostores/react"
import { sessionsByDay } from "@/stores/sessions"
import { availableMinutesByDay } from "@/stores/weeklyHours"
import daysOfWeek from "@/helpers/daysOfWeek"
import { minutesToDots } from "@/helpers/time/minutesToDots"

export default function Dailies() {
	const $sessionsByDay = useStore(sessionsByDay)
	const $availableMinutesByDay = useStore(availableMinutesByDay)

	// TODO: make sure sessions update with calendar update

	return (
		<>
			<div className="flex justify-between items-end">
				{$sessionsByDay.map((sessions, index) => (
					<div key={index}>
						<p>{daysOfWeek[index]}</p>
						<p className="font-mono">
							{minutesToDots(
								sessions
									.filter((ses) => ses.endTime !== null)
									.reduce(
										(acc, { startTime, endTime }) =>
											acc +
											differenceInMinutes(
												endTime!,
												startTime
											),
										0
									)
							) +
								"/" +
								minutesToDots($availableMinutesByDay[index])}
						</p>
					</div>
				))}
			</div>
		</>
	)
}
