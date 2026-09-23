import { useDroppable } from "@dnd-kit/react"
import { format, isToday } from "date-fns"
import AgendaItem from "./AgendaItem"
import type { AgendaWithIncludes } from "@/types/prisma-custom"

interface Props {
	date: Date
	items: AgendaWithIncludes[]
}

export default function DayAgenda({ date, items }: Props) {
	const { isDropTarget, ref } = useDroppable({
		id: date.toISOString(),
		data: { date },
	})

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
				{items.map((item) => (
					<AgendaItem
						item={item}
						key={item.id}
					/>
				))}
				{!isDropTarget && items.length === 0 && (
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
