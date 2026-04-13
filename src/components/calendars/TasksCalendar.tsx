import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import { actions } from "astro:actions"
import { MakeTimeType, Status } from "@/generated/prisma/enums"
import { useCallback, useRef, useState } from "react"
import type { EventImpl } from "@fullcalendar/core/internal"
import getItemUrl from "@/helpers/getItemUrl"
import getItemName from "@/helpers/getItemName"
import type { Task } from "@/generated/prisma/client"
import SideTray from "@/components/SideTray"

// TODO: filter by project (e.g. SH) or type (e.g. Learning)

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

export default function TasksCalendar() {
	const [highlights, setHighlights] = useState<Record<string, string>>({})
	const loadedRange = useRef<string>("")

	const [selectedTask, setSelectedTask] = useState<Task | null>(null)

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
						includeParentTask: true,
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
								name: contract.name,
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
							task: task,
							...(task.parentTask && {
								parentTask: task.parentTask,
							}),
							...(task.contract && {
								contract: {
									id: task.contractId,
									slug: task.contract.slug,
									name: task.contract.name,
								},
							}),
							...(task.guild && {
								guild: {
									id: task.guildId,
									slug: task.guild.slug,
									name: task.guild.name,
								},
							}),
							...(task.experiment && {
								experiment: {
									id: task.experimentId,
									slug: task.experiment.slug,
									name: task.experiment.name,
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
		<>
			<FullCalendar
				plugins={[dayGridPlugin, interactionPlugin]}
				initialView="dayGridWeek"
				height="auto"
				initialEvents={[]}
				headerToolbar={{
					center: "dayGridFourDay,dayGridWeek,dayGridMonth",
				}}
				views={{
					dayGridFourDay: {
						type: "dayGrid",
						duration: { days: 4 },
						buttonText: "4 days",
					},
				}}
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
					const parentName = getItemName(
						event.extendedProps.contract,
						event.extendedProps.guild,
						event.extendedProps.experiment,
						event.extendedProps.parentTask,
					)

					const isCompleted =
						event.extendedProps.status === Status.completed
					const isOnHold =
						event.extendedProps.status === Status.onhold

					return (
						<div
							className={`flex gap-1 px-1 py-1 ${isCompleted || isOnHold ? "items-center" : ""}`}
						>
							{/* {type === "contract" ? (
							<Icon
								icon="mingcute:document-2-fill"
								className="flex-none"
							/>
						) : isCompleted ? (
							<Icon
								icon="mingcute:check-circle-fill"
								className="flex-none text-white"
							/>
						) : (
							<Icon
								icon="mingcute:check-circle-line"
								className="flex-none"
							/>
						)} */}
							<div
								className={`${isCompleted || isOnHold ? "text-white" : "text-wrap"} leading-tight`}
							>
								{type == "task" &&
									parentName &&
									(event.extendedProps.parentTask ? (
										<span
											className="text-xs block mb-0.5 text-gray-500"
											onClick={() =>
												setSelectedTask(
													event.extendedProps
														.parentTask,
												)
											}
										>
											{parentName}
										</span>
									) : (
										<a
											href={url}
											className="text-xs block mb-0.5 text-gray-500"
										>
											{parentName}
										</a>
									))}
								{event.extendedProps.task ? (
									<span
										onClick={() =>
											setSelectedTask(
												event.extendedProps.task,
											)
										}
									>
										{event.title}
									</span>
								) : (
									<span>{event.title}</span>
								)}
							</div>
						</div>
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
								onPointerDown={(e) => e.stopPropagation()}
								onMouseDown={(e) => e.stopPropagation()}
								onTouchStart={(e) => e.stopPropagation()}
								onClick={(e) => e.stopPropagation()}
								className={`${highlights[dateKey] ? "bg-yellow-50" : ""} w-full resize-none border border-gray-300 rounded-lg px-1 py-0.5 text-sm leading-snug`}
								style={{ minHeight: "2.5em" }}
							/>
						</div>
					)
				}}
				/* ===============================
			   Handle event drag-and-drop
			   =============================== */
				editable
				eventDrop={async (info) => {
					const { type } = info.event.extendedProps
					if (type === "contract") {
						await actions.contract.updateJson({
							id: info.event.extendedProps.contract.id,
							...(info.event.start && {
								dueDate: info.event.start.toISOString(),
							}),
						})
					} else if (type === "task") {
						await actions.task.update({
							id: info.event.extendedProps.taskId,
							deadline: info.event.start,
						})
					}
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
