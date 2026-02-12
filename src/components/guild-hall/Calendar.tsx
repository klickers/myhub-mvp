import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import { actions } from "astro:actions"
import { MakeTimeType, Status } from "@/generated/prisma/enums"
import { Icon } from "@iconify/react"
import { useCallback, useRef, useState } from "react"
import type { EventImpl } from "@fullcalendar/core/internal"
import getItemUrl from "@/helpers/getItemUrl"

type CalendarEvent = {
	id: string
	title: string
	start: Date | string
	allDay?: boolean
	extendedProps: {
		type: "contract" | "task"
		status: Status
		contractId?: number
		taskId?: number
	}
}

export default function Calendar() {
	const [highlights, setHighlights] = useState<Record<string, string>>({})
	const loadedRange = useRef<string>("")

	const saveTimeouts = new Map<string, number>()
	const saveHighlight = (dateKey: string, value: string) => {
		setHighlights((prev) => ({ ...prev, [dateKey]: value }))
		if (saveTimeouts.has(dateKey)) clearTimeout(saveTimeouts.get(dateKey))
		saveTimeouts.set(
			dateKey,
			window.setTimeout(async () => {
				await actions.dailyHighlight.upsert({
					date: new Date(dateKey),
					highlight: value,
				})
			}, 500), // debounce
		)
	}

	const loadEvents = useCallback(
		async (info, successCallback) => {
			try {
				const start = info.start.toISOString()
				const end = info.end.toISOString()

				const statuses = Object.values(Status).filter(
					(status) => status !== Status.archived,
				)
				const [contractsRes, tasksRes] = await Promise.all([
					actions.contract.list({
						status: statuses,
						from: new Date(start),
						to: new Date(end),
					}),
					actions.task.listAll({
						status: statuses,
						from: new Date(start),
						to: new Date(end),
						includeContract: true,
						includeGuild: true,
						includeExperiment: true,
					}),
				])

				const contracts = contractsRes.data ?? []
				const tasks = tasksRes.data ?? []

				const contractEvents: CalendarEvent[] = contracts.map(
					(contract) => ({
						id: `contract-${contract.id}`,
						title: contract.name,
						start: contract.dueDate,
						allDay: true,
						extendedProps: {
							type: "contract",
							status: contract.status,
							contract: {
								id: contract.id,
								slug: contract.slug,
							},
						},
					}),
				)

				const taskEvents: CalendarEvent[] = tasks
					.filter((task) => task.deadline)
					.map((task) => ({
						id: `task-${task.id}`,
						title: task.name,
						start: task.deadline!,
						allDay: true,
						extendedProps: {
							type: "task",
							makeTimeType: task.makeTimeType,
							status: task.status,
							taskId: task.id,
							...(task.contract && {
								contract: {
									id: task.contractId,
									slug: task.contract.slug,
								},
							}),
							...(task.guild && {
								guild: {
									id: task.guildId,
									slug: task.guild.slug,
								},
							}),
							...(task.experiment && {
								experiment: {
									id: task.experimentId,
									slug: task.experiment.slug,
								},
							}),
						},
					}))

				successCallback([...contractEvents, ...taskEvents])
			} catch (error) {
				console.error("Failed to load calendar events", error)
			}
		},
		[], // ← IMPORTANT
	)

	return (
		<FullCalendar
			plugins={[dayGridPlugin]}
			initialView="dayGridMonth"
			height="auto"
			initialEvents={[]}
			/* ===============================
			   Load only events in view range
			   =============================== */
			events={loadEvents}
			eventOrder={(a, b) => {
				function getRank(event: unknown): number {
					if (
						typeof event === "object" &&
						event !== null &&
						"extendedProps" in event
					) {
						if (
							(event as EventImpl).extendedProps.status ===
							Status.completed
						)
							return 3
						const type = (event as EventImpl).extendedProps
							.makeTimeType
						return type === "highlight"
							? 0
							: type === "batch"
								? 1
								: 2
					}
					return 2
				}
				return getRank(a) - getRank(b)
			}}
			/* ===============================
			   Load daily highlights
			   =============================== */
			datesSet={async (arg) => {
				const key = `${arg.startStr}_${arg.endStr}`
				if (loadedRange.current === key) return
				loadedRange.current = key

				const res = await actions.dailyHighlight.listInRange({
					from: arg.start,
					to: arg.end,
				})
				const map = Object.fromEntries(
					(res.data ?? []).map((h) => [
						h.date.toISOString().slice(0, 10),
						h.highlight ?? "",
					]),
				)
				setHighlights(map)
			}}
			/* ===============================
			   Dynamic class names
			   =============================== */
			eventClassNames={(arg) => {
				const { extendedProps } = arg.event
				const classes: string[] = []

				switch (extendedProps.type) {
					case "contract":
						classes.push("calendar-contract")
						break
					case "task":
						classes.push("calendar-task")
						break
				}

				if (extendedProps.status === Status.completed)
					classes.push("calendar-completed")
				else if (extendedProps.status === Status.inprogress)
					classes.push("calendar-inprogress")
				else if (extendedProps.status === Status.onhold)
					classes.push("calendar-onhold")

				if (extendedProps.makeTimeType === MakeTimeType.highlight)
					classes.push("calendar-highlight")
				else if (extendedProps.makeTimeType === MakeTimeType.batch)
					classes.push("calendar-batch")

				return classes
			}}
			/* ===============================
			   Custom event rendering
			   =============================== */
			//    TODO: clicking event opens details, or side tray
			eventContent={(arg) => {
				const { event } = arg
				const { type } = event.extendedProps

				// TODO: open task in side tray on click; handle subtasks
				const url = getItemUrl(
					event.extendedProps.contract,
					event.extendedProps.guild,
					event.extendedProps.experiment,
				)

				return (
					<a
						href={url}
						className="flex gap-1 items-center px-1 py-0.5"
					>
						{type === "contract" ? (
							<Icon
								icon="mingcute:document-2-fill"
								className="flex-none"
							/>
						) : (
							<Icon
								icon="mingcute:check-circle-line"
								className="flex-none"
							/>
						)}
						<span>{event.title}</span>
					</a>
				)
			}}
			/* ===============================
			   Custom day cell content
			   =============================== */
			dayCellContent={(arg) => {
				const dateKey = arg.date.toISOString().slice(0, 10)
				return (
					<div className="flex flex-col gap-1 w-full h-full">
						<div className="w-full text-right text-xs">
							{arg.dayNumberText}
						</div>
						<textarea
							rows={2}
							value={highlights[dateKey] ?? ""}
							placeholder="Highlight"
							onChange={(e) =>
								saveHighlight(dateKey, e.target.value)
							}
							className={`${highlights[dateKey] ? "bg-yellow-50" : ""} w-full resize-none border border-gray-300 rounded px-1 py-0.5 text-sm leading-snug`}
							style={{ minHeight: "2.5em" }}
						/>
					</div>
				)
			}}
		/>
	)
}
