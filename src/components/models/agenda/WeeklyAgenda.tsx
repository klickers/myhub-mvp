import { useEffect, useMemo } from "react"
import { isSameDay, isToday } from "date-fns"
import { useAgendaStore } from "@/stores/agenda"
import { useTagsStore } from "@/stores/tags"
import DayAgenda from "./DayAgenda"
import DayAgendaHeader from "./DayAgendaHeader"

interface Props {
	filter:
		| { type: "all" }
		| { type: "tag"; id: number }
		| { type: "task"; id: number }
		| { type: "group"; id: number }
}

export default function WeeklyAgenda({ filter }: Props) {
	const agenda = useAgendaStore((state) => state.agenda)
	const loadAgenda = useAgendaStore((state) => state.loadAgenda)
	const days = useAgendaStore((state) => state.days)
	const allTags = useTagsStore((state) => state.tags)
	const loadTags = useTagsStore((state) => state.loadTags)

	useEffect(() => {
		loadAgenda()
		loadTags()
	}, [])

	const tags = useMemo(() => {
		if (filter.type !== "group") return []
		return allTags
			.flatMap((t) => t.children)
			.filter((tag) => tag.parentId === filter.id)
	}, [allTags, filter.type])

	const agendaItems = useMemo(() => {
		return agenda.filter((item) => {
			switch (filter.type) {
				case "tag":
					return item.task?.tags.some(
						(tag) => tag.tagId === filter.id,
					)
				case "group":
					return item.task?.tags.some((tag) =>
						tags.some((groupTag) => groupTag.id === tag.tagId),
					)
				case "all":
				default:
					return true
			}
		})
	}, [agenda, filter])

	return filter.type !== "group" ? (
		<div className="grid grid-cols-7 mb-6 text-xs">
			{days.map((day, index) => (
				<DayAgenda
					key={index}
					date={day.date}
					items={agendaItems.filter((item) =>
						isSameDay(item.date, day.date),
					)}
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
					<div className="pr-1">{tag.name}</div>
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
