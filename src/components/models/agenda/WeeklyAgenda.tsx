import { useEffect, useMemo } from "react"
import { isSameDay, isToday } from "date-fns"
import { useAgendaStore } from "@/stores/agenda"
import { useTagsStore } from "@/stores/tags"
import { useTasksStore } from "@/stores/tasks"
import DayAgenda from "./DayAgenda"
import DayAgendaHeader from "./DayAgendaHeader"
import buildTaskTree from "@/helpers/buildTaskTree"
import type { TaskNode } from "@/types/prisma-custom"

interface Props {
	date?: Date
	filter:
		| { type: "all" }
		| { type: "tag"; id: number }
		| { type: "task"; id: number }
		| { type: "group"; id: number }
}

export default function WeeklyAgenda({ date = new Date(), filter }: Props) {
	const getWeekKey = useAgendaStore((state) => state.getWeekKey)
	const loadAgendaWeek = useAgendaStore((state) => state.loadAgendaWeek)
	const agendaByWeek = useAgendaStore((state) => state.agendaByWeek)
	const daysByWeek = useAgendaStore((state) => state.daysByWeek)
	const allTags = useTagsStore((state) => state.tags)
	const loadTags = useTagsStore((state) => state.loadTags)
	const tasks =
		filter.type === "task" ? useTasksStore((state) => state.tasks) : []

	useEffect(() => {
		loadAgendaWeek(date)
		loadTags()
	}, [date, loadAgendaWeek, loadTags])

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
			.filter((tag) => tag.parentId === filter.id)
	}, [allTags, filter.type, filter.id])

	const taskTree = useMemo(() => {
		if (filter.type !== "task") return undefined
		return buildTaskTree(tasks, null, filter.id, null)[0]
	}, [filter.type, filter.id, tasks])

	const agendaItems = useMemo(() => {
		return agenda.filter((item) => {
			switch (filter.type) {
				case "tag":
					return item.task?.tags.some(
						(tag) => tag.tagId === filter.id,
					)
				case "task":
					const isInTree = (task: TaskNode | undefined): boolean => {
						if (!task) return false
						if (task.id === item.task?.id) return true
						return task.subtasks.some(isInTree)
					}
					return isInTree(taskTree)
				case "group":
					return item.task?.tags.some((tag) =>
						tags.some((groupTag) => groupTag.id === tag.tagId),
					)
				case "all":
				default:
					return true
			}
		})
	}, [agenda, filter, tags, taskTree])

	return filter.type !== "group" ? (
		<div className="grid grid-cols-7 mb-6 text-xs">
			{days.map((day, index) => (
				<DayAgenda
					key={index}
					date={day.date}
					items={agendaItems.filter((item) =>
						isSameDay(item.date, day.date),
					)}
					dropId={`${filter.type}-${day.date.toISOString()}`}
					addTaskId={filter.type === "task" ? filter.id : undefined}
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
							"px-1" + (isToday(day.date) ? " bg-yellow-50" : "")
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
									item.task?.tags.some(
										(taskTag) => taskTag.tagId === tag.id,
									),
							)}
						/>
					))}
				</div>
			))}
		</div>
	)
}
