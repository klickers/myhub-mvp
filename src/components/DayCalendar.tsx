import { useEffect, useRef } from "react"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import googleCalendarPlugin from "@fullcalendar/google-calendar"
import { useStore } from "@nanostores/react"
import { calendarApi } from "@/stores/calendar"
import { actions } from "astro:actions"
import { googleCalendarIds } from "@/stores/googleCalendarIds"
import { businessHours } from "@/stores/businessHours"

export default function Calendar() {
	const calendarRef = useRef<FullCalendar | null>(null)
	const $calendarApi = useStore(calendarApi)
	useEffect(() => {
		if (calendarRef.current) calendarApi.set(calendarRef.current.getApi())
	}, [])

	const $googleCalendarIds = useStore(googleCalendarIds)
	const setGoogleCalendarIds = async () => {
		if (!$calendarApi) return
		if ($googleCalendarIds.length == 0) {
			const ids = await actions.getGoogleCalendarIds.orThrow()
			googleCalendarIds.set(ids)
			ids.forEach(({ id }) => {
				$calendarApi.addEventSource({
					googleCalendarId: id,
				})
			})
		}
	}
	useEffect(() => {
		setGoogleCalendarIds()
	}, [$calendarApi])

	const $businessHours = useStore(businessHours)
	const setBusinessHours = async () => {
		if (!$calendarApi) return
		if ($businessHours.length == 0) {
			const bHours = await actions.getBusinessHours.orThrow()
			businessHours.set(bHours)
		}
	}
	useEffect(() => {
		setBusinessHours()
	}, [$calendarApi])

	return (
		<FullCalendar
			ref={calendarRef}
			plugins={[timeGridPlugin, googleCalendarPlugin]}
			googleCalendarApiKey={import.meta.env.PUBLIC_GCAL_API_KEY}
			businessHours
			initialView="timeGridDay"
			height="auto"
			headerToolbar={false}
			nowIndicator
			slotMinTime="07:00:00"
			eventClassNames={["calendar-home-event"]}
		/>
	)
}
