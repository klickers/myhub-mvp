import { useMemo } from "react"
import { useDroppable } from "@dnd-kit/react"
import { format, isSameDay, isToday } from "date-fns"
import { useAgendaStore } from "@/stores/agenda"
import { useTasksStore } from "@/stores/tasks"
import { Icon } from "@iconify/react"

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
			className={isToday(date) ? "bg-yellow-100" : ""}
		>
			<p className="flex gap-1 uppercase">
				<span className="font-semibold">{format(date, "EEE")}</span>
				<span>{format(date, "MM/dd")}</span>
			</p>
			<div className="space-y-0.5">
				{agendaItems.map((item) => (
					<div
						key={item.id}
						className={
							"relative cursor-pointer rounded-sm border border-gray-200 bg-gray-50 py-0.5 px-1" +
							(item.status === "completed"
								? " border-green-200 bg-green-50"
								: "")
						}
					>
						<button
							onClick={() =>
								item.task && openSideTray(item.task.id)
							}
							className="absolute right-0.5 top-0.5 text-[0.75rem] text-gray-500 hover:text-gray-800"
						>
							<Icon icon="mingcute:external-link-line" />
						</button>
						{item.task?.name}
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
