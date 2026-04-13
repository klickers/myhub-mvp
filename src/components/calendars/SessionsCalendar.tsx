import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { actions } from "astro:actions"
import { useCallback, useState } from "react"
import SideTray from "../SideTray"
import type { Task } from "@/generated/prisma/browser"

type CalendarEvent = {
	id: string
	title: string
	start: Date | string
	end: Date | string | null
	extendedProps: {
		type: "guild" | "contract" | "experiment" | "task"
		name: string
		slug?: string
		task?: Task
	}
}

export default function TasksCalendar() {
	const [selectedTask, setSelectedTask] = useState<Task | null>(null)

	const loadEvents = useCallback(async (info, successCallback) => {
		const res = await actions.session.list({
			from: info.start.toISOString(),
			to: info.end.toISOString(),
			withFullTask: true,
		})

		const events: CalendarEvent[] = (res.data ?? []).map((session) => {
			const sources = [
				{ key: "guild", type: "guild" },
				{ key: "contract", type: "contract" },
				{ key: "experiment", type: "experiment" },
				{ key: "task", type: "task" },
			] as const

			const found = sources.find(({ key }) => session[key])
			const item = found ? session[found.key] : null

			return {
				id: `session-${session.id}`,
				title: item?.name ?? "",
				start: session.startTime,
				end: session.endTime,
				extendedProps: {
					type: found?.type ?? "",
					name: item?.name ?? "",
					...(found?.type !== "task" && { slug: item?.slug }),
					...(found?.type === "task" && { task: session.task }),
				},
			}
		})
		successCallback(events)
	}, [])

	return (
		<>
			<FullCalendar
				plugins={[interactionPlugin, timeGridPlugin]}
				initialView="timeGridWeek"
				allDaySlot={false}
				height="auto"
				initialEvents={[]}
				events={loadEvents}
				eventClassNames={["calendar-session"]}
				/* ===============================
               Custom event rendering
               =============================== */
				eventContent={(arg) => {
					const { event } = arg
					const { type, slug } = event.extendedProps

					let url = "#!"
					if (type == "contract") url = `/hall/contracts/${slug}`
					else if (type == "guild") url = `/hall/guilds/${slug}`
					else if (type == "experiment")
						url = `/lab/experiments/${slug}`

					return (
						<div className={`flex gap-1 px-1 py-1`}>
							<div className={`leading-tight`}>
								{event.extendedProps.task ? (
									<span
										className="cursor-default"
										onClick={() =>
											setSelectedTask(
												event.extendedProps.task,
											)
										}
									>
										{event.title}
									</span>
								) : (
									<a href={url}>{event.title}</a>
								)}
							</div>
						</div>
					)
				}}
			/>
			{selectedTask && (
				<SideTray
					type="task"
					selected={selectedTask}
					setSelected={setSelectedTask}
				/>
			)}
		</>
	)
}
