import { useCallback } from "react"
import { actions } from "astro:actions"
import { Icon } from "@iconify/react"
import { format, differenceInMinutes } from "date-fns"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/react/timegrid"
import themePlugin from "@fullcalendar/react/themes/classic"
import type { Task } from "@/generated/prisma/browser"
import { useTasksStore } from "@/stores/tasks"

import "@fullcalendar/react/skeleton.css"

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
	const dailyTotals: Record<string, number> = {}
	const openSideTray = useTasksStore((state) => state.openSideTray)

	const loadEvents = useCallback(
		async (
			info: any,
			successCallback: (events: CalendarEvent[]) => void,
		) => {
			for (const key in dailyTotals)
				if (Object.hasOwn(dailyTotals, key)) delete dailyTotals[key]

			const res = await actions.session.list({
				from: info.start,
				to: info.end,
				withFullTask: true,
			})

			const events: CalendarEvent[] = (res.data ?? []).map((session) => {
				const sources = [{ key: "task", type: "task" }] as const
				const found = sources.find(({ key }) => session[key])
				const item = found ? session[found.key] : null

				if (session.startTime && session.endTime) {
					const dateKey = format(session.startTime, "yyyy-MM-dd")
					const duration = differenceInMinutes(
						session.endTime,
						session.startTime,
					)
					dailyTotals[dateKey] =
						(dailyTotals[dateKey] || 0) + duration
				}

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
					classNames: ["event--session"],
				}
			})

			successCallback(events)
		},
		[],
	)

	return (
		<div className="calendar calendar--sessions">
			<FullCalendar
				plugins={[timeGridPlugin, themePlugin]}
				initialView="timeGridWeek"
				allDaySlot={false}
				height="auto"
				initialEvents={[]}
				headerToolbar={{
					left: "timeGridDay,timeGridWeek",
					center: "title",
					right: "prev,today,next",
				}}
				nowIndicator
				slotMinTime="08:00:00"
				weekNumbers
				buttons={{
					next: {
						iconContent: <Icon icon="mingcute:right-fill" />,
					},
					prev: {
						iconContent: <Icon icon="mingcute:left-fill" />,
					},
				}}
				events={loadEvents}
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
				// ===========================
				// Styling
				// ===========================
				toolbarClass="flex justify-between items-center mb-4"
				toolbarTitleClass="text-base font-semibold"
				buttonGroupClass="flex items-center gap-1"
				buttonClass={(info) =>
					"uppercase text-xs px-1 py-1 rounded-lg border border-gray-300 hover:bg-gray-100" +
					(info.isDisabled || info.isSelected ? " bg-gray-100" : "")
				}
				dayHeaderRowClass="font-semibold uppercase text-sm"
				dayHeaderAlign="start"
				dayHeaderClass="!px-1"
				dayHeaderContent={(info) => (
					<div className="flex items-center gap-1">
						<span>{format(info.date, "EEE")}</span>
						<span className="text-xs text-gray-500">
							{(
								(dailyTotals[format(info.date, "yyyy-MM-dd")] ||
									0) / 60
							).toFixed(2)}
							h
						</span>
					</div>
				)}
				dayHeaderDividerClass="border-b border-gray-300"
				slotHeaderClass="text-sm font-medium"
				slotHeaderDividerClass="border-l border-gray-300"
				slotLaneClass="!border-b !border-gray-300"
				dayLaneClass="!border-r !border-gray-300"
				columnEventClass="text-xs rounded-md border border-blue-200 bg-blue-50 p-1 mb-0.5"
			/>
		</div>
	)
}
