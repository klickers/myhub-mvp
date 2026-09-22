import { useMemo } from "react"
import { useDroppable } from "@dnd-kit/react"
import { format, isSameDay, isToday } from "date-fns"
import { useAgendaStore } from "@/stores/agenda"
import { useTasksStore } from "@/stores/tasks"

interface Props {
	date: Date
	filter:
		| { type: "all" }
		| { type: "tag"; id: number }
		| { type: "task"; id: number }
}

export default function DayAgenda({ date, filter }: Props) {
	const agenda = useAgendaStore((state) => state.agenda)
	const agendaItems = useMemo(() => {
		return agenda.filter((item) => {
			switch (filter.type) {
				case "tag":
					return (
						isSameDay(item.date, date) &&
						item.task?.tags.some((tag) => tag.tagId === filter.id)
					)
				// case "task":
				// 	return where one parent task is the filter.id
				case "all":
				default:
					return isSameDay(item.date, date)
			}
		})
	}, [agenda, date, filter])

	const { isDropTarget, ref } = useDroppable({
		id: date.toISOString(),
		data: { date },
	})

	const openSideTray = useTasksStore((state) => state.openSideTray)

	return (
		<div
			ref={ref}
			className={isToday(date) ? "bg-green-50" : ""}
		>
			<p className="flex gap-1 uppercase">
				<span className="font-semibold">{format(date, "EEE")}</span>
				<span>{format(date, "MM/dd")}</span>
			</p>
			<div>
				{agendaItems.map((item) => (
					<div
						key={item.id}
						className="rounded-sm border border-gray-200 bg-gray-50 py-0.5 px-1"
					>
						{item.task && (
							<div
								onClick={() => openSideTray(item.task!.id)}
								className="cursor-pointer"
							>
								{item.task.name}
							</div>
						)}
					</div>
				))}
				{!isDropTarget && agendaItems.length === 0 && (
					<div className="rounded-sm border border-dashed border-gray-200 bg-gray-50 py-0.5 px-1 opacity-70">
						No agenda items yet.
					</div>
				)}
				{isDropTarget && (
					<div className="rounded-sm border border-dashed border-gray-200 bg-gray-50 py-0.5 px-1 opacity-70">
						Drop task here
					</div>
				)}
			</div>
		</div>
	)
}
