import { actions } from "astro:actions"
import {
	MakeTimeType,
	Status,
	TaskParentType,
} from "@/generated/prisma/enums"
import {
	addDays,
	addHours,
	addMonths,
	endOfMonth,
	format,
	isSameMonth,
	isToday,
	startOfDay,
	startOfMonth,
	startOfWeek,
} from "date-fns"
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react"
import getItemUrl from "@/helpers/getItemUrl"
import getItemName from "@/helpers/getItemName"
import type { Task } from "@/generated/prisma/client"
import SideTray from "@/components/SideTray"

type CalendarView = "fourDay" | "week" | "month"
type TaskCalendarLane = "guild" | "lab"
type CalendarEventType = "contract" | "task"

type RelatedItem = {
	id: number | null
	slug: string
	name: string
}

type TaskCalendarTask = Task & {
	contract?: RelatedItem | null
	guild?: RelatedItem | null
	experiment?: RelatedItem | null
	parentTask?: Task | null
	ancestorTasks?: Array<{
		experimentId?: number | null
		experiment?: unknown
		parentType?: TaskParentType | null
	}>
}

type CalendarItem = {
	id: string
	title: string
	start: Date | string
	type: CalendarEventType
	lane: TaskCalendarLane
	status: Status
	makeTimeType?: MakeTimeType | null
	taskId?: number
	contract?: RelatedItem
	guild?: RelatedItem
	experiment?: RelatedItem
	task?: TaskCalendarTask
	parentTask?: Task | null
}

type LaneMeasurements = Record<
	string,
	Partial<Record<TaskCalendarLane, Record<string, number>>>
>

function getDateKey(date: Date | string) {
	if (typeof date === "string") return date.slice(0, 10)
	return format(date, "yyyy-MM-dd")
}

function makeDays(start: Date, count: number) {
	const firstDay = startOfDay(start)
	return Array.from({ length: count }, (_, index) => addDays(firstDay, index))
}

function getCalendarRows(view: CalendarView, date: Date) {
	if (view === "fourDay") return [makeDays(date, 4)]
	if (view === "week") return [makeDays(startOfWeek(date), 7)]

	const firstVisibleDay = startOfWeek(startOfMonth(date))
	const lastVisibleDay = addDays(startOfWeek(endOfMonth(date)), 6)
	const dayCount =
		Math.round(
			(lastVisibleDay.getTime() - firstVisibleDay.getTime()) /
				(1000 * 60 * 60 * 24),
		) + 1

	const days = makeDays(firstVisibleDay, dayCount)
	const rows: Date[][] = []
	for (let index = 0; index < days.length; index += 7) {
		rows.push(days.slice(index, index + 7))
	}

	return rows
}

function getRangeLabel(view: CalendarView, rows: Date[][], date: Date) {
	const firstDay = rows[0]?.[0] ?? new Date()
	const lastRow = rows[rows.length - 1] ?? rows[0] ?? []
	const lastDay = lastRow[lastRow.length - 1] ?? firstDay

	if (view === "month") return format(date, "MMMM yyyy")
	if (format(firstDay, "yyyy") === format(lastDay, "yyyy")) {
		return `${format(firstDay, "MMM d")} - ${format(lastDay, "MMM d, yyyy")}`
	}

	return `${format(firstDay, "MMM d, yyyy")} - ${format(lastDay, "MMM d, yyyy")}`
}

function getRangeBounds(rows: Date[][]) {
	const firstDay = rows[0]?.[0] ?? new Date()
	const lastRow = rows[rows.length - 1] ?? rows[0] ?? []
	const lastDay = lastRow[lastRow.length - 1] ?? firstDay

	return {
		start: firstDay,
		end: addDays(lastDay, 1),
	}
}

function isLabTask(task?: TaskCalendarTask | null) {
	return Boolean(
		task?.experimentId ||
			task?.experiment ||
			task?.parentType === TaskParentType.experiment,
	)
}

function getTaskCalendarLane(task: TaskCalendarTask): TaskCalendarLane {
	if (
		isLabTask(task) ||
		isLabTask(task.parentTask as TaskCalendarTask | null) ||
		task.ancestorTasks?.some((ancestor) => isLabTask(ancestor as TaskCalendarTask))
	) {
		return "lab"
	}

	return "guild"
}

function getEventRank(item: CalendarItem) {
	if (item.status === Status.completed) return 4
	if (item.makeTimeType === MakeTimeType.highlight) return 1
	if (item.makeTimeType === MakeTimeType.batch) return 2
	return 3
}

function sortCalendarItems(a: CalendarItem, b: CalendarItem) {
	const rank = getEventRank(a) - getEventRank(b)
	if (rank !== 0) return rank
	return a.title.localeCompare(b.title)
}

function getMaxLaneHeight(
	measurements: Partial<Record<TaskCalendarLane, Record<string, number>>>,
	lane: TaskCalendarLane,
) {
	return Math.max(0, ...Object.values(measurements[lane] ?? {}))
}

function getItemClasses(item: CalendarItem) {
	const classes = [
		"tasks-calendar-card",
		item.type === "contract" ? "calendar-contract" : "calendar-task",
		item.lane === "lab" ? "calendar-lane-lab" : "calendar-lane-guild",
	]

	if (item.status === Status.completed) classes.push("calendar-completed")
	else if (item.status === Status.inprogress) classes.push("calendar-inprogress")
	else if (item.status === Status.onhold) classes.push("calendar-onhold")

	if (item.makeTimeType === MakeTimeType.highlight) classes.push("calendar-highlight")
	else if (item.makeTimeType === MakeTimeType.batch) classes.push("calendar-batch")

	return classes.join(" ")
}

function CalendarLaneDivider({
	children,
	lane,
}: {
	children: ReactNode
	lane: TaskCalendarLane
}) {
	return (
		<div
			className={`calendar-lane-divider-content calendar-lane-divider-content--${lane}`}
		>
			<span>{children}</span>
		</div>
	)
}

function MeasuredLane({
	children,
	height,
	lane,
	measurementKey,
	onMeasure,
	rowKey,
}: {
	children: ReactNode
	height: number
	lane: TaskCalendarLane
	measurementKey: string
	onMeasure: (
		rowKey: string,
		lane: TaskCalendarLane,
		measurementKey: string,
		height: number,
	) => void
	rowKey: string
}) {
	const contentRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		const content = contentRef.current
		if (!content) return

		const measure = () =>
			onMeasure(rowKey, lane, measurementKey, Math.ceil(content.scrollHeight))
		measure()

		const observer = new ResizeObserver(measure)
		observer.observe(content)

		return () => observer.disconnect()
	}, [lane, measurementKey, onMeasure, rowKey])

	return (
		<div
			className={`tasks-calendar-lane tasks-calendar-lane--${lane}`}
			style={{ minHeight: `${Math.max(height, 16)}px` }}
		>
			<div ref={contentRef} className="tasks-calendar-lane__content">
				{children}
			</div>
		</div>
	)
}

export default function TasksCalendar() {
	const [view, setView] = useState<CalendarView>("week")
	const [currentDate, setCurrentDate] = useState(() => new Date())
	const [items, setItems] = useState<CalendarItem[]>([])
	const [highlights, setHighlights] = useState<Record<string, string>>({})
	const [laneMeasurements, setLaneMeasurements] = useState<LaneMeasurements>({})
	const [selectedTask, setSelectedTask] = useState<Task | null>(null)
	const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
	const saveTimeouts = useRef(new Map<string, number>())

	const rows = useMemo(
		() => getCalendarRows(view, currentDate),
		[view, currentDate],
	)
	const { start: rangeStart, end: rangeEnd } = useMemo(
		() => getRangeBounds(rows),
		[rows],
	)
	const rangeLabel = useMemo(
		() => getRangeLabel(view, rows, currentDate),
		[currentDate, rows, view],
	)
	const columnCount = rows[0]?.length ?? 7

	const loadCalendarData = useCallback(async (start: Date, end: Date) => {
		try {
			const statuses = Object.values(Status).filter(
				(status) => status !== Status.archived,
			)
			const [contractsRes, tasksRes, highlightsRes] = await Promise.all([
				actions.contract.list({
					status: statuses,
					from: start,
					to: end,
				}),
				actions.task.listAll({
					status: statuses,
					from: start,
					to: end,
					includeContract: true,
					includeGuild: true,
					includeExperiment: true,
					includeParentTask: true,
					includeTaskAncestors: true,
				}),
				actions.dailyHighlight.listInRange({
					from: start,
					to: end,
				}),
			])

			const contractItems: CalendarItem[] = (contractsRes.data ?? []).map(
				(contract) => ({
					id: `contract-${contract.id}`,
					title: contract.name,
					start: contract.dueDate,
					type: "contract",
					lane: "guild",
					status: contract.status,
					contract: {
						id: contract.id,
						slug: contract.slug,
						name: contract.name,
					},
				}),
			)

			const taskItems: CalendarItem[] = (
				(tasksRes.data ?? []) as TaskCalendarTask[]
			)
				.filter((task) => task.deadline)
				.map((task) => ({
					id: `task-${task.id}`,
					title: task.name,
					start: task.deadline!,
					type: "task",
					lane: getTaskCalendarLane(task),
					makeTimeType: task.makeTimeType,
					status: task.status,
					taskId: task.id,
					task,
					parentTask: task.parentTask,
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
				}))

			setItems([...contractItems, ...taskItems])
			setHighlights(
				Object.fromEntries(
					(highlightsRes.data ?? []).map((highlight) => [
						getDateKey(highlight.date),
						highlight.highlight ?? "",
					]),
				),
			)
		} catch (error) {
			console.error("Failed to load calendar events", error)
		}
	}, [])

	useEffect(() => {
		void loadCalendarData(rangeStart, rangeEnd)
	}, [loadCalendarData, rangeEnd, rangeStart])

	useEffect(() => {
		setLaneMeasurements({})
	}, [rows])

	const itemsByDate = useMemo(() => {
		const map = new Map<string, Record<TaskCalendarLane, CalendarItem[]>>()

		for (const item of items) {
			const dateKey = getDateKey(item.start)
			const dayItems = map.get(dateKey) ?? { guild: [], lab: [] }
			dayItems[item.lane].push(item)
			map.set(dateKey, dayItems)
		}

		for (const dayItems of map.values()) {
			dayItems.guild.sort(sortCalendarItems)
			dayItems.lab.sort(sortCalendarItems)
		}

		return map
	}, [items])

	const saveHighlight = (dateKey: string, value: string) => {
		setHighlights((prev) => ({ ...prev, [dateKey]: value }))

		const timeout = saveTimeouts.current.get(dateKey)
		if (timeout) window.clearTimeout(timeout)

		saveTimeouts.current.set(
			dateKey,
			window.setTimeout(async () => {
				await actions.dailyHighlight.upsert({
					date: new Date(dateKey),
					highlight: value,
				})
			}, 500),
		)
	}

	const handleLaneMeasure = useCallback(
		(
			rowKey: string,
			lane: TaskCalendarLane,
			measurementKey: string,
			height: number,
		) => {
			setLaneMeasurements((prev) => {
				if (prev[rowKey]?.[lane]?.[measurementKey] === height) return prev
				return {
					...prev,
					[rowKey]: {
						...prev[rowKey],
						[lane]: {
							...prev[rowKey]?.[lane],
							[measurementKey]: height,
						},
					},
				}
			})
		},
		[],
	)

	const goToPrevious = () => {
		setCurrentDate((date) =>
			view === "month"
				? addMonths(date, -1)
				: addDays(date, view === "week" ? -7 : -4),
		)
	}

	const goToNext = () => {
		setCurrentDate((date) =>
			view === "month"
				? addMonths(date, 1)
				: addDays(date, view === "week" ? 7 : 4),
		)
	}

	const changeView = (nextView: CalendarView) => {
		setView(nextView)
		setCurrentDate((date) =>
			nextView === "month" ? startOfMonth(date) : date,
		)
	}

	const handleDrop = async (date: Date, itemId = draggedItemId) => {
		if (!itemId) return

		const item = items.find((candidate) => candidate.id === itemId)
		if (!item) return

		if (item.type === "contract" && item.contract?.id) {
			await actions.contract.updateJson({
				id: item.contract.id,
				dueDate: addHours(date, 3).toISOString(),
			})
		} else if (item.type === "task" && item.taskId) {
			await actions.task.update({
				id: item.taskId,
				deadline: addHours(date, 3),
			})
		}

		setDraggedItemId(null)
		await loadCalendarData(rangeStart, rangeEnd)
	}

	return (
		<>
			<div className="calendar-shell calendar-shell--tasks">
				<div className="tasks-calendar-toolbar">
					<div className="tasks-calendar-view-switcher">
						<button
							type="button"
							className={`tasks-calendar-button ${view === "fourDay" ? "tasks-calendar-button--active" : ""}`}
							onClick={() => changeView("fourDay")}
						>
							4 days
						</button>
						<button
							type="button"
							className={`tasks-calendar-button ${view === "week" ? "tasks-calendar-button--active" : ""}`}
							onClick={() => changeView("week")}
						>
							week
						</button>
						<button
							type="button"
							className={`tasks-calendar-button ${view === "month" ? "tasks-calendar-button--active" : ""}`}
							onClick={() => changeView("month")}
						>
							month
						</button>
					</div>

					<h2 className="tasks-calendar-title">{rangeLabel}</h2>

					<div className="tasks-calendar-navigation">
						<button
							type="button"
							className="tasks-calendar-button"
							onClick={() => setCurrentDate(new Date())}
						>
							today
						</button>
						<button
							type="button"
							className="tasks-calendar-button"
							aria-label="Previous range"
							onClick={goToPrevious}
						>
							{"<"}
						</button>
						<button
							type="button"
							className="tasks-calendar-button"
							aria-label="Next range"
							onClick={goToNext}
						>
							{">"}
						</button>
					</div>
				</div>

				<div
					className="tasks-calendar-weekdays"
					style={{
						gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
					}}
				>
					{rows[0]?.map((day) => (
						<div key={getDateKey(day)} className="tasks-calendar-weekday">
							{format(day, "EEE")}
						</div>
					))}
				</div>

				<div className="tasks-calendar-grid">
					{rows.map((row) => {
						const rowKey = `${getDateKey(row[0])}_${getDateKey(row[row.length - 1])}`
						const rowMeasurements = laneMeasurements[rowKey] ?? {}
						const guildLaneHeight = getMaxLaneHeight(
							rowMeasurements,
							"guild",
						)
						const labLaneHeight = getMaxLaneHeight(rowMeasurements, "lab")

						return (
							<div
								key={rowKey}
								className="tasks-calendar-row"
								style={{
									gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`,
								}}
							>
								{row.map((day) => {
									const dateKey = getDateKey(day)
									const dayItems = itemsByDate.get(dateKey) ?? {
										guild: [],
										lab: [],
									}
									const isOutsideMonth =
										view === "month" && !isSameMonth(day, currentDate)

									return (
										<div
											key={dateKey}
											className={`tasks-calendar-day ${isOutsideMonth ? "tasks-calendar-day--outside" : ""} ${isToday(day) ? "tasks-calendar-day--today" : ""}`}
											onDragOver={(event) => event.preventDefault()}
											onDrop={(event) => {
												event.preventDefault()
												void handleDrop(
													day,
													event.dataTransfer.getData("text/plain") ||
														draggedItemId,
												)
											}}
										>
											<div className="tasks-calendar-day__header">
												<span>{format(day, "d")}</span>
											</div>

											<textarea
												rows={2}
												value={highlights[dateKey] ?? ""}
												placeholder="Highlight"
												onChange={(event) =>
													saveHighlight(dateKey, event.target.value)
												}
												onPointerDown={(event) => event.stopPropagation()}
												onMouseDown={(event) => event.stopPropagation()}
												onTouchStart={(event) => event.stopPropagation()}
												onClick={(event) => event.stopPropagation()}
												className={`calendar-highlight-input ${highlights[dateKey] ? "calendar-highlight-input--filled" : ""}`}
												style={{ minHeight: "2.5em" }}
											/>

											<CalendarLaneDivider lane="guild">
												Guild Hall
											</CalendarLaneDivider>

											<MeasuredLane
												rowKey={rowKey}
												lane="guild"
												measurementKey={dateKey}
												height={guildLaneHeight}
												onMeasure={handleLaneMeasure}
											>
												{dayItems.guild.map((item) => (
													<CalendarCard
														key={item.id}
														item={item}
														setDraggedItemId={setDraggedItemId}
														setSelectedTask={setSelectedTask}
													/>
												))}
											</MeasuredLane>

											<CalendarLaneDivider lane="lab">
												Alchemy Lab
											</CalendarLaneDivider>

											<MeasuredLane
												rowKey={rowKey}
												lane="lab"
												measurementKey={dateKey}
												height={labLaneHeight}
												onMeasure={handleLaneMeasure}
											>
												{dayItems.lab.map((item) => (
													<CalendarCard
														key={item.id}
														item={item}
														setDraggedItemId={setDraggedItemId}
														setSelectedTask={setSelectedTask}
													/>
												))}
											</MeasuredLane>
										</div>
									)
								})}
							</div>
						)
					})}
				</div>
			</div>

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

function CalendarCard({
	item,
	setDraggedItemId,
	setSelectedTask,
}: {
	item: CalendarItem
	setDraggedItemId: (id: string | null) => void
	setSelectedTask: (task: Task | null) => void
}) {
	const url = getItemUrl(
		item.contract ?? null,
		item.guild ?? null,
		item.experiment ?? null,
	)
	const parentName = getItemName(
		item.contract ?? null,
		item.guild ?? null,
		item.experiment ?? null,
		item.parentTask ?? null,
	)

	return (
		<div
			className={getItemClasses(item)}
			draggable
			onDragStart={(event) => {
				event.dataTransfer.effectAllowed = "move"
				event.dataTransfer.setData("text/plain", item.id)
				setDraggedItemId(item.id)
			}}
			onDragEnd={() => setDraggedItemId(null)}
		>
			<div className="calendar-event-card flex gap-1 px-2 py-1.5">
				<div className="text-wrap leading-tight">
					{item.type === "task" &&
						parentName &&
						(item.parentTask ? (
							<span
								className="calendar-event-card__meta block cursor-pointer text-xs"
								onClick={() => setSelectedTask(item.parentTask ?? null)}
							>
								{parentName}
							</span>
						) : (
							<a
								href={url}
								className="calendar-event-card__meta block text-xs"
							>
								{parentName}
							</a>
						))}
					{item.task ? (
						<span
							className="cursor-pointer"
							onClick={() => setSelectedTask(item.task ?? null)}
						>
							{item.title}
						</span>
					) : (
						<span>{item.title}</span>
					)}
				</div>
			</div>
		</div>
	)
}
