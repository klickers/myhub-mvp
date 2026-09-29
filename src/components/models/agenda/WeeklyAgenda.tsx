import { useEffect, useMemo, useState } from "react"
import { isSameDay, isSameWeek, isToday, addDays } from "date-fns"
import { Icon } from "@iconify/react"
import { useAgendaStore } from "@/stores/agenda"
import { useTagsStore } from "@/stores/tags"
import { useTasksStore } from "@/stores/tasks"
import DayAgenda from "./DayAgenda"
import DayAgendaHeader from "./DayAgendaHeader"
import buildTaskTree from "@/helpers/buildTaskTree"
import type { TaskNode } from "@/types/prisma-custom"

interface Props {
	filter:
		| { type: "all" }
		| { type: "tag"; id: number }
		| { type: "task"; id: number }
		| { type: "group"; id: number }
}

export default function WeeklyAgenda({ filter }: Props) {
	const [date, setDate] = useState(new Date())
	const filterId = "id" in filter ? filter.id : null

	const getWeekKey = useAgendaStore((state) => state.getWeekKey)
	const loadAgendaWeek = useAgendaStore((state) => state.loadAgendaWeek)
	const agendaByWeek = useAgendaStore((state) => state.agendaByWeek)
	const daysByWeek = useAgendaStore((state) => state.daysByWeek)
	const allTags = useTagsStore((state) => state.tags)
	const loadTags = useTagsStore((state) => state.loadTags)
	const loadTasks = useTasksStore((state) => state.loadTasks)
	const tasks = useTasksStore((state) => state.tasks)
	const taskIdsByEffectiveTagId = useTasksStore(
		(state) => state.taskIdsByEffectiveTagId,
	)
	const taskIdsByEffectiveTagGroupId = useTasksStore(
		(state) => state.taskIdsByEffectiveTagGroupId,
	)

	useEffect(() => {
		loadAgendaWeek(date)
	}, [date, loadAgendaWeek])

	useEffect(() => {
		loadTags()
		loadTasks()
	}, [loadTags, loadTasks])

	const weekKey = useMemo(() => getWeekKey(date), [getWeekKey, date])

	const agenda = useMemo(
		() => agendaByWeek[weekKey] ?? [],
		[agendaByWeek, weekKey],
	)

	const days = useMemo(() => daysByWeek[weekKey] ?? [], [daysByWeek, weekKey])

	const tags = useMemo(() => {
		if (filter.type !== "group") return []
		return allTags
			.flatMap((t) => t.children)
			.filter((tag) => tag.parentId === filterId)
	}, [allTags, filter.type, filterId])

	const allowedTaskIds = useMemo(() => {
		if (filter.type === "tag")
			return new Set(taskIdsByEffectiveTagId[filter.id] ?? [])
		if (filter.type === "group")
			return new Set(taskIdsByEffectiveTagGroupId[filter.id] ?? [])
		return null
	}, [
		filter.type,
		filterId,
		taskIdsByEffectiveTagGroupId,
		taskIdsByEffectiveTagId,
	])

	const taskIdSetsByTagId = useMemo(() => {
		return Object.fromEntries(
			tags.map((tag) => [
				tag.id,
				new Set(taskIdsByEffectiveTagId[tag.id] ?? []),
			]),
		) as Record<number, Set<number>>
	}, [tags, taskIdsByEffectiveTagId])

	const taskTree = useMemo(() => {
		if (filter.type !== "task") return undefined
		return buildTaskTree(tasks, null, filter.id, null)[0]
	}, [filter.type, filterId, tasks])

	const agendaItems = useMemo(() => {
		switch (filter.type) {
			case "tag":
				return agenda.filter((item) =>
					allowedTaskIds?.has(item.task?.id ?? -1),
				)
			case "task":
				return agenda.filter((item) => {
					const isInTree = (task: TaskNode | undefined): boolean => {
						if (!task) return false
						if (task.id === item.task?.id) return true
						return task.subtasks.some(isInTree)
					}
					return isInTree(taskTree)
				})
			case "group":
				return agenda.filter((item) =>
					allowedTaskIds?.has(item.task?.id ?? -1),
				)
			case "all":
			default:
				return agenda
		}
	}, [agenda, allowedTaskIds, filter.type, taskTree])

	return (
		<>
			{/* Controls */}
			<div className="flex gap-1 items-center mb-4 justify-end">
				<button
					className="px-1 py-1 rounded-lg border border-gray-300 hover:bg-gray-100"
					onClick={() => setDate(addDays(date, -7))}
				>
					<Icon icon="mingcute:left-fill" />
				</button>
				<button
					className={
						"px-2 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 text-xs uppercase" +
						(isSameWeek(date, new Date()) ? " bg-gray-100" : "")
					}
					onClick={() => setDate(new Date())}
				>
					Today
				</button>
				<button
					className="px-1 py-1 rounded-lg border border-gray-300 hover:bg-gray-100"
					onClick={() => setDate(addDays(date, 7))}
				>
					<Icon icon="mingcute:right-fill" />
				</button>
			</div>

			{filter.type !== "group" ? (
				<div className="grid grid-cols-7 mb-6 text-xs">
					{days.map((day, index) => (
						<DayAgenda
							key={index}
							date={day.date}
							items={agendaItems.filter((item) =>
								isSameDay(item.date, day.date),
							)}
							dropId={`${filter.type}-${day.date.toISOString()}`}
							addTaskId={
								filter.type === "task" ? filter.id : undefined
							}
						/>
					))}
				</div>
			) : (
				<div className="flex flex-col mb-6">
					<div className="grid grid-cols-8 text-xs">
						<div></div>
						{days.map((day, index) => (
							<div
								className={
									"px-1" +
									(isToday(day.date) ? " bg-yellow-50" : "")
								}
								key={index}
							>
								<DayAgendaHeader date={day.date} />
							</div>
						))}
					</div>
					{tags.map((tag) => (
						<div
							key={tag.id}
							className="grid grid-cols-8 text-xs"
						>
							<a
								href={`/tags/${tag.slug}`}
								className="pr-1 cursor-pointer hover:underline"
							>
								{tag.name}
							</a>
							{days.map((day, index) => (
								<DayAgenda
									key={index}
									date={day.date}
									dropId={`tag-${tag.id}-${day.date.toISOString()}`}
									showHeader={false}
									items={agendaItems.filter(
										(item) =>
											isSameDay(item.date, day.date) &&
											taskIdSetsByTagId[tag.id]?.has(
												item.task?.id ?? -1,
											),
									)}
								/>
							))}
						</div>
					))}
				</div>
			)}
		</>
	)
}
