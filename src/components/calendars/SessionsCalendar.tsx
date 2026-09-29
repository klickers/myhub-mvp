import { useCallback } from "react"
import { actions } from "astro:actions"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { Task } from "@/generated/prisma/browser"
import { useTasksStore } from "@/stores/tasks"

type CalendarEvent = {
	id: string
	title: string
	start: Date | string
	end?: Date | string
	extendedProps: {
		type: "task" | "session"
		task?: Task
	}
}

export default function SessionCalendar() {
	const openSideTray = useTasksStore((state) => state.openSideTray)

	const loadEvents = useCallback(
		async (
			info: any,
			successCallback: (events: CalendarEvent[]) => void,
		) => {
			const res = await actions.session.list({
				from: info.start,
				to: info.end,
				withFullTask: true,
			})

			const events: CalendarEvent[] = (res.data ?? []).map((session) => {
				const sources = [{ key: "task", type: "task" }] as const

				const found = sources.find(({ key }) => session[key])
				const item = found ? session[found.key] : null

				return {
					id: `session-${session.id}`,
					title: item?.name ?? "",
					start: session.startTime,
					end: session.endTime ?? undefined,
					extendedProps: {
						type: found?.type ?? "session",
						...(found?.type === "task" && session.task
							? { task: session.task }
							: {}),
					},
				}
			})

			successCallback(events)
		},
		[],
	)

	return (
		<div className="calendar calendar--sessions">
			<FullCalendar
				plugins={[interactionPlugin, timeGridPlugin]}
				initialView="timeGridWeek"
				allDaySlot={false}
				height="auto"
				initialEvents={[]}
				headerToolbar={{
					left: "timeGridDay,timeGridWeek",
					center: "title",
					right: "today prev,next",
				}}
				nowIndicator
				slotMinTime="08:00:00"
				events={loadEvents}
				eventClassNames={["event--session"]}
				eventContent={(arg) => {
					const { event } = arg
					return (
						<div>
							{event.extendedProps.task ? (
								<span
									className="cursor-pointer"
									onClick={() =>
										openSideTray(
											event.extendedProps.task.id ?? -1,
										)
									}
								>
									{event.title}
								</span>
							) : (
								<span>Error loading task</span>
							)}
						</div>
					)
				}}
			/>
		</div>
	)
}
