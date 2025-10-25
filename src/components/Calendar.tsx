import { useEffect, useRef } from "react"
import FullCalendar from "@fullcalendar/react"
import { type EventApi } from "@fullcalendar/core"
import timeGridPlugin from "@fullcalendar/timegrid"
import googleCalendarPlugin from "@fullcalendar/google-calendar"
import {
	addDays,
	differenceInMinutes,
	endOfWeek,
	getWeek,
	getYear,
	startOfWeek,
} from "date-fns"
import googleCalendarIds from "@/data/googleCalendarIds"
import { useStore } from "@nanostores/react"
import { calendarApi, weekNumber } from "@/stores/calendar"
import { actions } from "astro:actions"
import { buckets } from "@/stores/buckets"
import { weeklyMinutes } from "@/stores/weeklyHours"
import businessHours from "@/data/businessHours"

function getAvailableMinutes(events: EventApi[], businessHours: any[]) {
	const totalWorkMinutes = businessHours.reduce(
		(t, { daysOfWeek, startTime, endTime }) =>
			t +
			daysOfWeek.length *
				(+endTime.slice(0, 2) * 60 +
					+endTime.slice(3) -
					(+startTime.slice(0, 2) * 60 + +startTime.slice(3))),
		0
	)

	const workEventMinutes = events.reduce((sum, e) => {
		if (!e.start || !e.end) return sum

		let overlapMinutes = 0,
			cur = new Date(e.start)
		while (cur < e.end) {
			const dayStart = new Date(cur)
			dayStart.setHours(0, 0, 0, 0)
			const dayEnd = addDays(dayStart, 1)
			const eventStart = cur
			const eventEnd = new Date(Math.min(+e.end, +dayEnd))
			const day = eventStart.getDay()

			for (const b of businessHours) {
				if (!b.daysOfWeek.includes(day)) continue
				const [sh, sm] = b.startTime.split(":").map(Number)
				const [eh, em] = b.endTime.split(":").map(Number)
				const bhStart = new Date(dayStart)
				bhStart.setHours(sh, sm, 0, 0)
				const bhEnd = new Date(dayStart)
				bhEnd.setHours(eh, em, 0, 0)

				const overlapStart = new Date(Math.max(+eventStart, +bhStart))
				const overlapEnd = new Date(Math.min(+eventEnd, +bhEnd))
				if (overlapEnd > overlapStart)
					overlapMinutes += differenceInMinutes(
						overlapEnd,
						overlapStart
					)
			}
			cur = eventEnd
		}
		return sum + overlapMinutes
	}, 0)
	return totalWorkMinutes - workEventMinutes
}

export default function Calendar() {
	const calendarRef = useRef<FullCalendar | null>(null)
	const $calendarApi = useStore(calendarApi)
	useEffect(() => {
		calendarApi.set(calendarRef.current?.getApi())
	}, [])

	const setBuckets = async () => {
		if ($calendarApi) {
			const fullBuckets = await actions.getFullBucketsByWeek.orThrow({
				year: getYear($calendarApi?.getDate()),
				weekNumber: getWeek($calendarApi.getDate()),
				weekStart: startOfWeek($calendarApi.getDate()),
				weekEnd: endOfWeek($calendarApi.getDate()),
			})
			buckets.set(fullBuckets)
		}
	}
	useEffect(() => {
		setBuckets()
	}, [$calendarApi])

	return (
		<div className="hidden">
			<FullCalendar
				ref={calendarRef}
				plugins={[timeGridPlugin, googleCalendarPlugin]}
				googleCalendarApiKey={import.meta.env.PUBLIC_GCAL_API_KEY}
				eventSources={[...googleCalendarIds]}
				businessHours
				datesSet={(info) => {
					weekNumber.set(getWeek(info.start))
					setBuckets()
				}}
				eventsSet={(events) => {
					const bufferMinutes = 1.5 * 6 * 60,
						availableMinutes = getAvailableMinutes(
							events,
							businessHours
						)
					weeklyMinutes.set({
						...weeklyMinutes.get(),
						available: availableMinutes - bufferMinutes,
						buffer: bufferMinutes,
					})
				}}
			/>
		</div>
	)
}
