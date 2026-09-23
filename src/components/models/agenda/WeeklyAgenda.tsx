import { useEffect, useMemo } from "react"
import { isSameDay } from "date-fns"
import { useAgendaStore } from "@/stores/agenda"
import { useTagsStore } from "@/stores/tags"
import DayAgenda from "./DayAgenda"

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
					console.log("tags", tags)
					return item.task?.tags.some((tag) =>
						tags.some((groupTag) => groupTag.id === tag.tagId),
					)
				case "all":
				default:
					return true
			}
		})
	}, [agenda, filter])

	return (
		<div className="grid grid-cols-7 gap-2 mb-6 text-xs">
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
	)
}
