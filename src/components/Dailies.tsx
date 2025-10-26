import { useEffect } from "react"
import { actions } from "astro:actions"
import { startOfWeek, endOfWeek, differenceInMinutes } from "date-fns"
import { useStore } from "@nanostores/react"
import { calendarApi } from "@/stores/calendar"
import { sessions, sessionsByDay } from "@/stores/sessions"
import { availableMinutesByDay } from "@/stores/weeklyHours"
import daysOfWeek from "@/helpers/daysOfWeek"
import { minutesToDots } from "@/helpers/time/minutesToDots"

export default function WeeklyHeader() {
	const $calendarApi = useStore(calendarApi)
	const $sessionsByDay = useStore(sessionsByDay)
	const $availableMinutesByDay = useStore(availableMinutesByDay)

	// TODO: make sure sessions update with calendar update
	const setSessions = async () => {
		if ($calendarApi) {
			const sessionsByWeek = await actions.getSessionsByWeek.orThrow({
				weekStart: startOfWeek($calendarApi.getDate()),
				weekEnd: endOfWeek($calendarApi.getDate()),
			})
			sessions.set(sessionsByWeek)
		}
	}
	useEffect(() => {
		setSessions()
	}, [$calendarApi])

	return (
		<>
			<div className="flex justify-between items-end">
				{$sessionsByDay.map((sessions, index) => (
					<div>
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
