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
import { availableMinutesByDay, weeklyMinutes } from "@/stores/weeklyHours"
import businessHours from "@/data/businessHours"

function getAvailableMinutes(events: EventApi[], businessHours: any[]) {
	// Step 1: Total work minutes per day and overall
	const totalWorkMinutesByDay = Array(7).fill(0)
	for (const { daysOfWeek, startTime, endTime } of businessHours) {
		const startMinutes = +startTime.slice(0, 2) * 60 + +startTime.slice(3)
		const endMinutes = +endTime.slice(0, 2) * 60 + +endTime.slice(3)
		const duration = endMinutes - startMinutes
		for (const day of daysOfWeek) {
			totalWorkMinutesByDay[day] += duration
		}
	}
	const totalWorkMinutes = totalWorkMinutesByDay.reduce((a, b) => a + b, 0)

	// Step 2: Minutes occupied by events per day
	const workEventMinutesByDay = Array(7).fill(0)
	let totalEventMinutes = 0

	for (const e of events) {
		if (!e.start || !e.end) continue

		// TODO: optimize loop and functions

		const start = new Date(e.start)
		const end = new Date(e.end)
		const isAllDay =
			start.getHours() === 0 &&
			start.getMinutes() === 0 &&
			start.getSeconds() === 0 &&
			end.getHours() === 0 &&
			end.getMinutes() === 0 &&
			end.getSeconds() === 0
		if (isAllDay) continue

		let cur = new Date(e.start)
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
				if (overlapEnd > overlapStart) {
					const overlapMinutes = differenceInMinutes(
						overlapEnd,
						overlapStart
					)
					workEventMinutesByDay[day] += overlapMinutes
					totalEventMinutes += overlapMinutes
				}
			}
			cur = eventEnd
		}
	}

	// Step 3: Compute available minutes
	const availableMinutesByDay = totalWorkMinutesByDay.map(
		(total, i) => total - workEventMinutesByDay[i]
	)
	const availableMinutes = totalWorkMinutes - totalEventMinutes

	return { availableMinutes, availableMinutesByDay }
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
			weeklyMinutes.set({
				...weeklyMinutes.get(),
				planned: fullBuckets.reduce(
					(acc, { totalScheduledTime }) => acc + totalScheduledTime,
					0
				),
			})
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
					// TODO: make sure overlap calculation is working properly (see Friday)
					const mins = getAvailableMinutes(events, businessHours)
					weeklyMinutes.set({
						...weeklyMinutes.get(),
						available: mins.availableMinutes,
					})
					availableMinutesByDay.set(mins.availableMinutesByDay)
				}}
			/>
		</div>
	)
}
