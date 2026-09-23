import { useDroppable } from "@dnd-kit/react"
import { isToday } from "date-fns"
import AgendaItem from "./AgendaItem"
import type { AgendaWithIncludes } from "@/types/prisma-custom"
import DayAgendaHeader from "./DayAgendaHeader"

interface Props {
	date: Date
	items: AgendaWithIncludes[]
	showHeader?: boolean
}

export default function DayAgenda({ date, items, showHeader = true }: Props) {
	const { isDropTarget, ref } = useDroppable({
		id: date.toISOString(),
		data: { date },
	})

	return (
		<div
			ref={ref}
			className={"p-1 " + (isToday(date) ? "bg-yellow-50" : "")}
		>
			{showHeader && <DayAgendaHeader date={date} />}
			<div className="space-y-0.5">
				{items.map((item) => (
					<AgendaItem
						item={item}
						key={item.id}
					/>
				))}
				{!isDropTarget && items.length === 0 && (
					<div className="rounded-sm border border-dashed border-gray-200 py-0.5 px-1 opacity-70">
						No items yet.
					</div>
				)}
				{isDropTarget && (
					<div className="rounded-sm border border-dashed border-gray-200 py-0.5 px-1 opacity-70">
						Drop task here
					</div>
				)}
			</div>
		</div>
	)
}
